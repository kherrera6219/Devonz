// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// In-memory store to simulate Redis for rate limiting tests
const mockStore = new Map<string, string>();

vi.mock('./services/redisService', () => ({
  redisService: {
    get: vi.fn((key: string) => Promise.resolve(mockStore.get(key) ?? null)),
    set: vi.fn((key: string, value: string) => {
      mockStore.set(key, value);
      return Promise.resolve('OK');
    }),
    del: vi.fn((key: string) => {
      mockStore.delete(key);
      return Promise.resolve(1);
    }),
    isConnected: vi.fn(() => true),
  },
}));

// Mock the logger to avoid noise
vi.mock('~/utils/logger', () => ({
  createScopedLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
  }),
}));

import { checkRateLimit, createSecurityHeaders } from './security.server';

describe('Security Server Module', () => {
  beforeEach(() => {
    mockStore.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
    mockStore.clear();
  });

  describe('createSecurityHeaders', () => {
    it('should include all required security headers', () => {
      const headers = createSecurityHeaders();

      expect(headers['X-Frame-Options']).toBe('DENY');
      expect(headers['X-Content-Type-Options']).toBe('nosniff');
      expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
      expect(headers['Permissions-Policy']).toContain('camera=()');

      // X-XSS-Protection intentionally removed (deprecated, CSP provides protection)
      expect((headers as Record<string, string>)['X-XSS-Protection']).toBeUndefined();
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
});
