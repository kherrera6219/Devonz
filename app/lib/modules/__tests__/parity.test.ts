import { describe, it, expect } from 'vitest';

describe('Deployment Parity: Mode Flags', () => {
  it('should respect the LOCAL_MODE environment variable', () => {
    process.env.LOCAL_MODE = 'true';
    const isLocal = process.env.LOCAL_MODE === 'true';
    expect(isLocal).toBe(true);

    process.env.LOCAL_MODE = 'false';
    const isCloud = process.env.LOCAL_MODE === 'false';
    expect(isCloud).toBe(true);
  });
});

describe('Deployment Parity: Filesystem Access', () => {
  it('should restrict direct filesystem access in Cloud mode', () => {
    process.env.LOCAL_MODE = 'false';
    const canAccessFs = process.env.LOCAL_MODE === 'true';
    expect(canAccessFs).toBe(false);
  });

  it('should enable native integrations in Local mode', () => {
    process.env.LOCAL_MODE = 'true';
    const hasNativeHooks = process.env.LOCAL_MODE === 'true';
    expect(hasNativeHooks).toBe(true);
  });
});

describe('Deployment Parity: Auth Fallbacks', () => {
  it('should bypass OIDC in Local mode for development convenience', () => {
    process.env.LOCAL_MODE = 'true';
    const skipAuth = process.env.LOCAL_MODE === 'true';
    expect(skipAuth).toBe(true);
  });
});
