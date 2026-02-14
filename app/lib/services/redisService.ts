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

  private constructor() {
    this._initialize();
  }

  static getInstance(): RedisService {
    if (!RedisService._instance) {
      RedisService._instance = new RedisService();
    }

    return RedisService._instance;
  }

  private _initialize() {
    try {
      this._client = new Redis(REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 3) {
            logger.warn('Redis connection retry limit reached. Continuing without Redis.');
            return null;
          }

          return Math.min(times * 100, 3000);
        },
      });

      this._client.on('connect', () => {
        this._isConnected = true;
        logger.info('Connected to Redis');
      });

      this._client.on('error', (error) => {
        this._isConnected = false;
        logger.error('Redis connection error', error);
      });
    } catch (error) {
      logger.error('Failed to initialize Redis client', error);
    }
  }

  async get(key: string): Promise<string | null> {
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
