import type { AppLoadContext } from '@remix-run/node';
import { RemixServer } from '@remix-run/react';
import { isbot } from 'isbot';
import { renderToPipeableStream } from 'react-dom/server';
import { PassThrough } from 'node:stream';
import { createSecurityHeaders } from '~/lib/security';

const ABORT_DELAY = 5_000;

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: any,
  _loadContext: AppLoadContext,
) {
  const callbackName = isbot(request.headers.get('user-agent') || '') ? 'onAllReady' : 'onShellReady';

  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      <RemixServer context={remixContext} url={request.url} abortDelay={ABORT_DELAY} />,
      {
        [callbackName]: () => {
          shellRendered = true;
          console.log('[SSR] Processing shell ready...');

          const body = new PassThrough();

          responseHeaders.set('Content-Type', 'text/html');
          responseHeaders.set('Cross-Origin-Embedder-Policy', 'credentialless');
          responseHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');

          // Microsoft Security Best Practices Headers
          responseHeaders.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
          responseHeaders.set('X-Content-Type-Options', 'nosniff');
          responseHeaders.set('X-Frame-Options', 'DENY');
          responseHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');

          // Content Security Policy (CSP)
          // Managed centrally in app/lib/security.ts
          const securityHeaders = createSecurityHeaders();
          const csp = securityHeaders['Content-Security-Policy'];

          responseHeaders.set('Content-Security-Policy', csp);

          resolve(
            new Response(body as unknown as ReadableStream, {
              headers: responseHeaders,
              status: responseStatusCode,
            }),
          );

          pipe(body);
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          responseStatusCode = 500;

          if (shellRendered) {
            console.error(error);
          }
        },
      },
    );

    setTimeout(abort, ABORT_DELAY);
  });
}
