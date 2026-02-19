import type { AppLoadContext } from '@remix-run/node';
import { RemixServer } from '@remix-run/react';
import { isbot } from 'isbot';
import { renderToPipeableStream } from 'react-dom/server';
import { PassThrough } from 'node:stream';
import { createSecurityHeaders, generateNonce } from '~/lib/security.server';
import { createScopedLogger } from '~/utils/logger';
import crypto from 'node:crypto';
import { requestContext } from '~/lib/context.server';
import { httpRequestDurationMicroseconds } from '~/lib/metrics.server';

const logger = createScopedLogger('SSR');

const ABORT_DELAY = 5_000;

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: any,
  _loadContext: AppLoadContext,
) {
  const requestId = request.headers.get('X-Request-ID') || crypto.randomUUID();
  const startTime = Date.now();
  const nonce = generateNonce();

  // Add Request ID to response headers
  responseHeaders.set('X-Request-ID', requestId);

  return requestContext.run({ requestId }, async () => {
    const callbackName = isbot(request.headers.get('user-agent') || '') ? 'onAllReady' : 'onShellReady';

    return new Promise((resolve, reject) => {
      let shellRendered = false;
      const { pipe, abort } = renderToPipeableStream(
        <RemixServer context={remixContext} url={request.url} abortDelay={ABORT_DELAY} />,
        {
          [callbackName]: () => {
            shellRendered = true;
            logger.info(`[${requestId}] Processing shell ready...`);

            const body = new PassThrough();

            responseHeaders.set('Content-Type', 'text/html');

            responseHeaders.set('Cross-Origin-Embedder-Policy', 'credentialless');
            responseHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');

            // Microsoft Security Best Practices Headers
            responseHeaders.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
            responseHeaders.set('X-Content-Type-Options', 'nosniff');
            responseHeaders.set('X-Frame-Options', 'DENY');
            responseHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');

            /*
             * Content Security Policy (CSP)
             * Managed centrally in app/lib/security.ts
             */
            const securityHeaders = createSecurityHeaders(nonce);
            const csp = securityHeaders['Content-Security-Policy'];

            responseHeaders.set('Content-Security-Policy', csp);

            resolve(
              new Response(body as unknown as ReadableStream, {
                headers: responseHeaders,
                status: responseStatusCode,
              }),
            );

            pipe(body);

            // Record actual request duration metrics
            try {
              if (typeof httpRequestDurationMicroseconds !== 'undefined') {
                const durationSeconds = (Date.now() - startTime) / 1000;
                httpRequestDurationMicroseconds
                  .labels(request.method, new URL(request.url).pathname, String(responseStatusCode))
                  .observe(durationSeconds);
              }
            } catch {
              // Ignore metrics errors
            }
          },
          onShellError(error: unknown) {
            reject(error);
          },
          onError(error: unknown) {
            responseStatusCode = 500;

            // Record error metrics with actual duration
            try {
              if (typeof httpRequestDurationMicroseconds !== 'undefined') {
                const durationSeconds = (Date.now() - startTime) / 1000;
                httpRequestDurationMicroseconds
                  .labels(request.method, new URL(request.url).pathname, String(responseStatusCode))
                  .observe(durationSeconds);
              }
            } catch {
              // Ignore metrics errors
            }

            if (shellRendered) {
              logger.error('SSR rendering error:', error);
            }
          },
        },
      );

      setTimeout(abort, ABORT_DELAY);
    });
  });
}
