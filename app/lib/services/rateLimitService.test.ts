import { describe, it, expect, beforeEach } from 'vitest';
import { RateLimitService } from '../rateLimitService';

describe('RateLimitService', () => {
  const service = RateLimitService.getInstance();

  beforeEach(() => {
    // We can't easily clear the private map, but we can use unique keys per test
  });

  it('should allow requests under the limit', async () => {
    const key = 'test-ip-1';
    const config = { windowMs: 1000, maxRequests: 2 };

    expect(await service.check(key, config)).toBe(true);
    expect(await service.check(key, config)).toBe(true);
  });

  it('should block requests over the limit', async () => {
    const key = 'test-ip-2';
    const config = { windowMs: 1000, maxRequests: 1 };

    expect(await service.check(key, config)).toBe(true);
    expect(await service.check(key, config)).toBe(false);
  });

  it('should reset after window expires', async () => {
    const key = 'test-ip-3';
    const config = { windowMs: 100, maxRequests: 1 };

    expect(await service.check(key, config)).toBe(true);
    expect(await service.check(key, config)).toBe(false);

    // Wait for expiration
    await new Promise((r) => setTimeout(r, 150));

    expect(await service.check(key, config)).toBe(true);
  });
});
