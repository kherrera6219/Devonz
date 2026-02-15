import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { redisService } from './services/redisService';
import { createScopedLogger } from '~/utils/logger';
import crypto from 'node:crypto';
import { rbacEngine, type Permission, type UserRole } from '~/lib/modules/security/rbacEngine';
import { sanitizeErrorMessage } from './security-utils';

const logger = createScopedLogger('Security');

// Rate limiting configuration
const RATE_LIMITS = {
  // General API endpoints
  '/api/*': { windowMs: 15 * 60 * 1000, maxRequests: 100 }, // 100 requests per 15 minutes

  // LLM API (more restrictive)
  '/api/llmcall': { windowMs: 60 * 1000, maxRequests: 10 }, // 10 requests per minute

  // Chat API (more restrictive)
  '/api/chat': { windowMs: 60 * 1000, maxRequests: 20 }, // 20 requests per minute

  // GitHub API endpoints
  '/api/github-*': { windowMs: 60 * 1000, maxRequests: 30 }, // 30 requests per minute

  // GitLab API endpoints
  '/api/gitlab-*': { windowMs: 60 * 1000, maxRequests: 30 }, // 30 requests per minute

  // Netlify API endpoints
  '/api/netlify-*': { windowMs: 60 * 1000, maxRequests: 20 }, // 20 requests per minute

  // Vercel API endpoints
  '/api/vercel-*': { windowMs: 60 * 1000, maxRequests: 20 }, // 20 requests per minute

  // File import (restrictive)
  '/api/import-file': { windowMs: 60 * 1000, maxRequests: 10 }, // 10 per minute
};

/**
 * Trusted proxy configuration.
 * When behind a reverse proxy (nginx, Cloudflare, etc.), only trust
 * IP headers from known proxy addresses.
 */
const TRUSTED_PROXIES = new Set((process.env.TRUSTED_PROXIES || '127.0.0.1,::1').split(',').map((ip) => ip.trim()));

/**
 * Rate limiting middleware (asynchronous, Redis-backed)
 */
export async function checkRateLimit(
  request: Request,
  endpoint: string,
): Promise<{ allowed: boolean; resetTime?: number }> {
  const clientIP = getClientIP(request);
  const key = `ratelimit:${clientIP}:${endpoint}`;

  // Find matching rate limit rule
  const rule = Object.entries(RATE_LIMITS).find(([pattern]) => {
    if (pattern.endsWith('/*')) {
      const basePattern = pattern.slice(0, -2);
      return endpoint.startsWith(basePattern);
    }

    if (pattern.endsWith('-*')) {
      const basePattern = pattern.slice(0, -1);
      return endpoint.startsWith(basePattern);
    }

    return endpoint === pattern;
  });

  if (!rule) {
    return { allowed: true };
  }

  const [, config] = rule;
  const now = Date.now();

  try {
    const data = await redisService.get(key);
    const rateLimitData = data ? JSON.parse(data) : { count: 0, resetTime: now + config.windowMs };

    // Reset if window has passed
    if (rateLimitData.resetTime < now) {
      rateLimitData.count = 0;
      rateLimitData.resetTime = now + config.windowMs;
    }

    if (rateLimitData.count >= config.maxRequests) {
      return { allowed: false, resetTime: rateLimitData.resetTime };
    }

    // Update rate limit data
    rateLimitData.count++;
    await redisService.set(key, JSON.stringify(rateLimitData), Math.ceil((rateLimitData.resetTime - now) / 1000));

    return { allowed: true };
  } catch (error) {
    logger.error(`Rate limit error for ${key}`, error);
    return { allowed: true }; // Fail open in case of Redis error
  }
}

/**
 * Get client IP address from request.
 * Uses a priority-based approach with trusted proxy validation.
 */
function getClientIP(request: Request): string {
  // Cloudflare's connecting IP is most reliable when behind CF
  const cfConnectingIP = request.headers.get('cf-connecting-ip');

  if (cfConnectingIP && isValidIP(cfConnectingIP)) {
    return cfConnectingIP;
  }

  // For x-forwarded-for, take the leftmost (client) IP only if we trust the proxy
  const forwardedFor = request.headers.get('x-forwarded-for');

  if (forwardedFor) {
    const ips = forwardedFor.split(',').map((ip) => ip.trim());

    // Walk from rightmost to find the first non-trusted IP
    for (let i = ips.length - 1; i >= 0; i--) {
      if (!TRUSTED_PROXIES.has(ips[i]) && isValidIP(ips[i])) {
        return ips[i];
      }
    }
  }

  const realIP = request.headers.get('x-real-ip');

  if (realIP && isValidIP(realIP)) {
    return realIP;
  }

  return 'unknown';
}

/**
 * Basic IP format validation
 */
function isValidIP(ip: string): boolean {
  // IPv4
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
    return ip.split('.').every((octet) => {
      const num = parseInt(octet, 10);
      return num >= 0 && num <= 255;
    });
  }

  // IPv6 (simplified check)
  if (/^[0-9a-fA-F:]+$/.test(ip) && ip.includes(':')) {
    return true;
  }

  return false;
}

/**
 * Generate a cryptographically secure nonce for CSP
 */
export function generateNonce(): string {
  return crypto.randomBytes(16).toString('base64');
}

/**
 * Security headers middleware
 */
export function createSecurityHeaders(nonce?: string) {
  const scriptSrc = ["script-src 'self' https:"]; // Added https:

  if (nonce) {
    scriptSrc.push(`'nonce-${nonce}'`, "'strict-dynamic'", "'unsafe-eval'"); // unsafe-eval needed for Monaco/WebContainer
  } else {
    // Fallback for environments without nonce support
    scriptSrc.push("'unsafe-inline'", "'unsafe-eval'");
  }

  return {
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',

    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',

    // Enable XSS protection
    'X-XSS-Protection': '1; mode=block',

    // Content Security Policy
    'Content-Security-Policy': [
      "default-src 'self'",
      scriptSrc.join(' '),
      "style-src 'self' 'unsafe-inline' https:", // Added https: per entry.server.tsx
      "img-src 'self' data: https: blob:",
      "font-src 'self' data: https:", // Added https:
      [
        "connect-src 'self' https: wss:", // Allow wildcard HTTPS/WSS for stability (WebContainer/Monaco needs)
        // Specific domains kept for documentation/safelisting if we go strict later
      ].join(' '),
      "frame-src 'self' https:", // Generalized
      "media-src 'self' data: https: blob:", // Added media-src
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "worker-src 'self' blob:",
    ].join('; '),

    // Referrer Policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Permissions Policy (formerly Feature Policy)
    'Permissions-Policy': ['camera=()', 'microphone=()', 'geolocation=()', 'payment=()'].join(', '),

    // HSTS (HTTP Strict Transport Security) - only in production
    ...(process.env.NODE_ENV === 'production'
      ? {
          'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
        }
      : {}),
  };
}

/**
 * Security wrapper for API routes
 */
export function withSecurity<T extends (args: ActionFunctionArgs | LoaderFunctionArgs) => Promise<Response>>(
  handler: T,
  options: {
    requireAuth?: boolean;
    rateLimit?: boolean;
    csrf?: boolean;
    allowedMethods?: string[];
    permission?: Permission;
  } = {},
) {
  return async (args: ActionFunctionArgs | LoaderFunctionArgs): Promise<Response> => {
    const { request } = args;
    const url = new URL(request.url);
    const endpoint = url.pathname;

    // Check allowed methods
    if (options.allowedMethods && !options.allowedMethods.includes(request.method)) {
      return new Response('Method not allowed', {
        status: 405,
        headers: createSecurityHeaders(),
      });
    }

    // RBAC Check
    if (options.permission) {
      /*
       * TODO: Retrieve actual user role from session/JWT
       * For now, we assume a default secure role or developer role based on environment
       * In a real app, this would be: const role = session.user.role;
       */
      const role: UserRole = process.env.NODE_ENV === 'development' ? 'DEVELOPER' : 'VIEWER';

      const hasPermission = rbacEngine.can(role, options.permission);

      if (!hasPermission) {
        logger.warn(
          `RBAC Access Denied: User with role '${role}' attempted to access '${endpoint}' requires '${options.permission}'`,
        );
        return new Response('Forbidden: Insufficient Permissions', {
          status: 403,
          headers: createSecurityHeaders(),
        });
      }
    }

    // CSRF Check (only for mutating methods if enabled)
    if (options.csrf && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      // Dynamic import to avoid bundling server code in client
      const { validateCsrf } = await import('~/lib/csrf.server');
      const isValid = validateCsrf(request, request.headers.get('Cookie'));

      if (!isValid) {
        return new Response('Invalid CSRF Token', {
          status: 403,
          headers: createSecurityHeaders(),
        });
      }
    }

    // Apply rate limiting in all environments
    if (options.rateLimit !== false) {
      const rateLimitResult = await checkRateLimit(request, endpoint);

      if (!rateLimitResult.allowed) {
        return new Response('Rate limit exceeded', {
          status: 429,
          headers: {
            ...createSecurityHeaders(),
            'Retry-After': Math.ceil((rateLimitResult.resetTime! - Date.now()) / 1000).toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime!.toString(),
          },
        });
      }
    }

    try {
      // Execute the handler
      const response = await handler(args);

      // Add security headers to response
      const responseHeaders = new Headers(response.headers);
      Object.entries(createSecurityHeaders()).forEach(([key, value]) => {
        responseHeaders.set(key, value);
      });

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    } catch (error) {
      console.error('Security-wrapped handler error:', error);

      const errorMessage = sanitizeErrorMessage(error, process.env.NODE_ENV === 'development');

      return new Response(
        JSON.stringify({
          error: true,
          message: errorMessage,
        }),
        {
          status: 500,
          headers: {
            ...createSecurityHeaders(),
            'Content-Type': 'application/json',
          },
        },
      );
    }
  };
}
