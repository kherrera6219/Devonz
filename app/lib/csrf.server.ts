import crypto from 'node:crypto';

/**
 * Generate a random CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate CSRF token (Double Submit Cookie pattern)
 */
export function validateCsrf(request: Request, cookieHeader: string | null): boolean {
  if (!cookieHeader) {
    return false;
  }

  const tokenFromHeader = request.headers.get('x-csrf-token');

  if (!tokenFromHeader) {
    return false;
  }

  const cookies = cookieHeader.split(';').reduce(
    (acc, cookie) => {
      const [key, value] = cookie.trim().split('=');

      if (key) {
        acc[key] = value;
      }

      return acc;
    },
    {} as Record<string, string>,
  );

  const tokenFromCookie = cookies.csrf_token;

  // Constant-time comparison to prevent timing attacks
  if (!tokenFromCookie || tokenFromCookie.length !== tokenFromHeader.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(tokenFromCookie), Buffer.from(tokenFromHeader));
}
