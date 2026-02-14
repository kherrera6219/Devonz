import { describe, it, expect } from 'vitest';
import { checkRateLimit, createSecurityHeaders, validateApiKeyFormat, sanitizeErrorMessage } from './security';

describe('Security Module', () => {
  describe('createSecurityHeaders', () => {
    it('should include all required security headers', () => {
      const headers = createSecurityHeaders();

      expect(headers['X-Frame-Options']).toBe('DENY');
      expect(headers['X-Content-Type-Options']).toBe('nosniff');
      expect(headers['X-XSS-Protection']).toBe('1; mode=block');
      expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
      expect(headers['Permissions-Policy']).toContain('camera=()');
    });

    it('should include Content-Security-Policy', () => {
      const headers = createSecurityHeaders();

      expect(headers['Content-Security-Policy']).toBeDefined();
      expect(headers['Content-Security-Policy']).toContain("default-src 'self'");
      expect(headers['Content-Security-Policy']).toContain("object-src 'none'");
    });
  });

  describe('checkRateLimit', () => {
    it('should allow requests under the limit', async () => {
      const request = new Request('http://localhost/api/test', {
        headers: { 'x-forwarded-for': '1.2.3.4' },
      });

      const result = await checkRateLimit(request, '/api/test');
      expect(result.allowed).toBe(true);
    });

    it('should block requests over the limit', async () => {
      const ip = '10.0.0.1';

      for (let i = 0; i < 101; i++) {
        const request = new Request('http://localhost/api/ratelimit-test', {
          headers: { 'x-forwarded-for': ip },
        });
        await checkRateLimit(request, '/api/ratelimit-test');
      }

      const request = new Request('http://localhost/api/ratelimit-test', {
        headers: { 'x-forwarded-for': ip },
      });
      const result = await checkRateLimit(request, '/api/ratelimit-test');
      expect(result.allowed).toBe(false);
    });
  });

  describe('validateApiKeyFormat', () => {
    it('should reject empty strings', () => {
      expect(validateApiKeyFormat('', 'openai')).toBe(false);
    });

    it('should reject placeholder values', () => {
      expect(validateApiKeyFormat('your_api_key_here', 'openai')).toBe(false);
    });

    it('should reject too-short keys', () => {
      expect(validateApiKeyFormat('short', 'openai')).toBe(false);
    });

    it('should accept valid-length keys', () => {
      const validKey = 'sk-' + 'a'.repeat(50);
      expect(validateApiKeyFormat(validKey, 'openai')).toBe(true);
    });
  });

  describe('sanitizeErrorMessage', () => {
    it('should show full error in development', () => {
      const error = new Error('Detailed API key error');
      expect(sanitizeErrorMessage(error, true)).toBe('Detailed API key error');
    });

    it('should hide API key errors in production', () => {
      const error = new Error('Invalid API key provided');
      expect(sanitizeErrorMessage(error, false)).toBe('Authentication failed');
    });

    it('should show rate limit message in production', () => {
      const error = new Error('rate limit exceeded');
      expect(sanitizeErrorMessage(error, false)).toBe('Rate limit exceeded. Please try again later.');
    });

    it('should show generic message for other errors in production', () => {
      const error = new Error('Some internal error');
      expect(sanitizeErrorMessage(error, false)).toBe('An unexpected error occurred');
    });
  });
});
