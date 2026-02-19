import Redis from 'ioredis';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('RedisService');

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = Number(process.env.REDIS_PORT) || 6379;
const REDIS_URL = process.env.REDIS_URL || `redis://${REDIS_HOST}:${REDIS_PORT}`;

export class RedisService {
  private static _instance: RedisService;
  private _client: Redis | null = null;
  private _isConnected = false;
  private _initAttempted = false;

  private constructor() {
    /* Lazy initialization — Redis is optional for local desktop usage */
  }

  static getInstance(): RedisService {
    if (!RedisService._instance) {
      RedisService._instance = new RedisService();
    }

    return RedisService._instance;
  }

  /**
   * Lazily initialize Redis connection on first use.
   * If Redis is unreachable, logs once and returns without error.
   */
  private _ensureInitialized(): boolean {
    if (this._isConnected) {
      return true;
    }

    if (this._initAttempted) {
      return false;
    }

    this._initAttempted = true;

    try {
      this._client = new Redis(REDIS_URL, {
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => {
          if (times > 1) {
            logger.info('Redis not available — running in local-only mode.');

            return null; // Stop retrying
          }

          return 500;
        },
        lazyConnect: true,
        enableOfflineQueue: false,
      });

      this._client.on('connect', () => {
        this._isConnected = true;
        logger.info('Connected to Redis');
      });

      this._client.on('error', () => {
        this._isConnected = false;

        // Don't spam logs - only log once
      });

      this._client.on('close', () => {
        this._isConnected = false;
      });

      // Attempt connection (non-blocking)
      this._client.connect().catch(() => {
        logger.info('Redis not available — all caching/rate-limiting will use in-memory fallbacks.');
        this._client = null;
      });
    } catch {
      logger.info('Redis not available — running in local-only mode.');
      this._client = null;
    }

    return this._isConnected;
  }

  async get(key: string): Promise<string | null> {
    this._ensureInitialized();

    if (!this._isConnected || !this._client) {
      return null;
    }

    try {
      return await this._client.get(key);
    } catch (error) {
      logger.error(`Redis GET error for key: ${key}`, error);
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    this._ensureInitialized();

    if (!this._isConnected || !this._client) {
      return;
    }

    try {
      if (ttlSeconds) {
        await this._client.set(key, value, 'EX', ttlSeconds);
      } else {
        await this._client.set(key, value);
      }
    } catch (error) {
      logger.error(`Redis SET error for key: ${key}`, error);
    }
  }

  async del(key: string): Promise<void> {
    this._ensureInitialized();

    if (!this._isConnected || !this._client) {
      return;
    }

    try {
      await this._client.del(key);
    } catch (error) {
      logger.error(`Redis DEL error for key: ${key}`, error);
    }
  }

  async sadd(key: string, ...members: string[]): Promise<void> {
    this._ensureInitialized();

    if (!this._isConnected || !this._client) {
      return;
    }

    try {
      await this._client.sadd(key, ...members);
    } catch (error) {
      logger.error(`Redis SADD error for key: ${key}`, error);
    }
  }

  async smembers(key: string): Promise<string[]> {
    this._ensureInitialized();

    if (!this._isConnected || !this._client) {
      return [];
    }

    try {
      return await this._client.smembers(key);
    } catch (error) {
      logger.error(`Redis SMEMBERS error for key: ${key}`, error);
      return [];
    }
  }

  get isConnected(): boolean {
    return this._isConnected;
  }

  async disconnect(): Promise<void> {
    if (this._client) {
      await this._client.quit();
      this._isConnected = false;
      this._client = null;
      logger.info('Redis client disconnected');
    }
  }
}

export const redisService = RedisService.getInstance();
