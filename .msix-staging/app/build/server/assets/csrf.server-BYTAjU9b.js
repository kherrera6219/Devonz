import Buffer from 'vite-plugin-node-polyfills/shims/buffer';
import crypto from 'node:crypto';

function generateCsrfToken() {
  return crypto.randomBytes(32).toString("hex");
}
function validateCsrf(request, cookieHeader) {
  if (!cookieHeader) {
    return false;
  }
  const tokenFromHeader = request.headers.get("x-csrf-token");
  if (!tokenFromHeader) {
    return false;
  }
  const cookies = cookieHeader.split(";").reduce(
    (acc, cookie) => {
      const [key, value] = cookie.trim().split("=");
      if (key) {
        acc[key] = value;
      }
      return acc;
    },
    {}
  );
  const tokenFromCookie = cookies.csrf_token;
  if (!tokenFromCookie || tokenFromCookie.length !== tokenFromHeader.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(tokenFromCookie), Buffer.from(tokenFromHeader));
}

export { generateCsrfToken, validateCsrf };
