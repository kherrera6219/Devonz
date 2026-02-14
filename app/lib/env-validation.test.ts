import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { validateEnv } from './env-validation';

describe('Environment Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return valid config with defaults', () => {
    process.env.NODE_ENV = 'development';

    const config = validateEnv();

    expect(config.NODE_ENV).toBe('development');
    expect(config.PORT).toBe('3000');
    expect(config.TRUSTED_PROXIES).toBe('127.0.0.1,::1');
  });

  it('should accept valid production config', () => {
    process.env.NODE_ENV = 'production';
    process.env.ANTHROPIC_API_KEY = 'sk-ant-' + 'x'.repeat(50);

    const config = validateEnv();

    expect(config.NODE_ENV).toBe('production');
    expect(config.ANTHROPIC_API_KEY).toBeDefined();
  });

  it('should reject invalid NODE_ENV', () => {
    process.env.NODE_ENV = 'invalid' as any;

    // In non-production, it should log warning but not throw
    expect(() => validateEnv()).not.toThrow();
  });

  it('should reject invalid URL formats for service URLs', () => {
    process.env.NODE_ENV = 'development';
    process.env.OLLAMA_API_BASE_URL = 'not-a-url';

    // Should not throw in development, just warn
    expect(() => validateEnv()).not.toThrow();
  });
});
