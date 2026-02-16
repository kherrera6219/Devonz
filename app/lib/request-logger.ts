import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('http');

// sanitizeHeaders was unused and removed.

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
 * Log a structured event (OpenTelemetry-ready placeholder).
 */
export function logEvent(
  name: string,
  attributes: Record<string, unknown> = {},
  level: 'info' | 'warn' | 'error' = 'info',
): void {
  logger[level](
    JSON.stringify({
      event: name,
      timestamp: new Date().toISOString(),
      ...attributes,
    }),
  );
}

/**
 * Wrap an API handler with request/response logging.
 */
export function withRequestLogging<T extends (...args: unknown[]) => Promise<Response>>(handler: T): T {
  return (async (...args: unknown[]) => {
    const context = args[0] as { request?: Request };
    const request = context?.request || (args[0] as Request);
    const start = Date.now();

    try {
      const response = await handler(...args);
      logRequest(request, response.status, Date.now() - start);

      return response;
    } catch (error) {
      logRequest(request, 500, Date.now() - start);
      throw error;
    }
  }) as unknown as T;
}
