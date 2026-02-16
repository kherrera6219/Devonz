import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('RateLimitService');

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

/*
 * Simple in-memory storage for now.
 * In production, this should be replaced with Redis.
 */
const storage = new Map<string, { count: number; expiresAt: number }>();

export class RateLimitService {
  private static _instance: RateLimitService;

  private constructor() {}

  static getInstance(): RateLimitService {
    if (!RateLimitService._instance) {
      RateLimitService._instance = new RateLimitService();
    }

    return RateLimitService._instance;
  }

  /**
   * Check if a key (IP or UserId) is rate limited.
   * Returns true if request should be allowed, false if blocked.
   */
  async check(key: string, config: RateLimitConfig = { windowMs: 60 * 1000, maxRequests: 20 }): Promise<boolean> {
    const now = Date.now();
    const record = storage.get(key);

    if (!record || now > record.expiresAt) {
      storage.set(key, { count: 1, expiresAt: now + config.windowMs });
      return true;
    }

    if (record.count >= config.maxRequests) {
      logger.warn(`Rate limit exceeded for key: ${key}`);
      return false;
    }

    record.count++;

    return true;
  }
}

export const rateLimitService = RateLimitService.getInstance();
