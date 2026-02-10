import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('http');

/**
 * Sanitize sensitive headers before logging.
 */
function sanitizeHeaders(headers: Headers): Record<string, string> {
  const sensitiveHeaders = new Set([
    'authorization',
    'cookie',
    'set-cookie',
    'x-api-key',
    'x-authorization',
  ]);

  const result: Record<string, string> = {};

  headers.forEach((value, key) => {
    if (sensitiveHeaders.has(key.toLowerCase())) {
      result[key] = '[REDACTED]';
    } else {
      result[key] = value;
    }
  });

  return result;
}

/**
 * Log HTTP request/response for auditing and debugging.
 * Only logs in production mode with appropriate sanitization.
 */
export function logRequest(request: Request, status: number, durationMs: number): void {
  const url = new URL(request.url);

  logger.info(
    JSON.stringify({
      method: request.method,
      path: url.pathname,
      status,
      durationMs,
      userAgent: request.headers.get('user-agent') || 'unknown',
      ip: request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown',
    }),
  );
}

/**
 * Wrap an API handler with request/response logging.
 */
export function withRequestLogging<T extends (...args: any[]) => Promise<Response>>(handler: T): T {
  return (async (...args: any[]) => {
    const request = args[0]?.request || args[0];
    const start = Date.now();

    try {
      const response = await handler(...args);
      logRequest(request, response.status, Date.now() - start);

      return response;
    } catch (error) {
      logRequest(request, 500, Date.now() - start);
      throw error;
    }
  }) as T;
}
