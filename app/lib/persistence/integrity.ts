import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('DataIntegrity');
const ENCODER = new TextEncoder();

/**
 * Integrity secret: must be set via APP_SECRET env var.
 * In dev, falls back to a dev-only key with a console warning.
 * In production, missing key will throw at first use.
 */
const DEV_ONLY_SECRET = 'dev-integrity-secret-2026';

function getIntegritySecret(): string {
  const envKey = typeof process !== 'undefined' ? process.env.APP_SECRET : undefined;

  if (envKey) {
    return envKey;
  }

  const isProd =
    (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') ||
    (typeof import.meta !== 'undefined' && import.meta.env?.PROD);

  if (isProd) {
    throw new Error(
      'APP_SECRET environment variable is required in production. ' +
        'Set a 32+ character secret key in your environment.',
    );
  }

  console.warn('[Integrity] Using development-only integrity secret. Set APP_SECRET for production.');

  return DEV_ONLY_SECRET;
}

const INTEGRITY_SECRET = getIntegritySecret();

/**
 * Data Layer: Snapshot Integrity System
 * Provides HMAC-SHA256 signing and verification for chat snapshots.
 * Uses Web Crypto API for browser compatibility.
 */
export class SnapshotIntegrity {
  private static _instance: SnapshotIntegrity;
  private _key: CryptoKey | null = null;

  private constructor() {
    // Singleton
  }

  static getInstance(): SnapshotIntegrity {
    if (!SnapshotIntegrity._instance) {
      SnapshotIntegrity._instance = new SnapshotIntegrity();
    }

    return SnapshotIntegrity._instance;
  }

  private async _getKey(): Promise<CryptoKey> {
    if (this._key) {
      return this._key;
    }

    const keyData = ENCODER.encode(INTEGRITY_SECRET);

    this._key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, [
      'sign',
      'verify',
    ]);

    return this._key;
  }

  /**
   * Signs a snapshot object and returns the HMAC signature.
   */
  async sign(data: unknown): Promise<string> {
    try {
      const key = await this._getKey();
      const serialized = JSON.stringify(data);
      const buffer = ENCODER.encode(serialized);
      const signature = await crypto.subtle.sign('HMAC', key, buffer);

      return Array.from(new Uint8Array(signature))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    } catch (error) {
      logger.error('Signing failed', error);
      throw error;
    }
  }

  /**
   * Verifies the integrity of a snapshot using its signature.
   */
  async verify(data: unknown, signature: string): Promise<boolean> {
    try {
      const expected = await this.sign(data);

      return expected === signature;
    } catch (error) {
      logger.error('Verification failed', error);

      return false;
    }
  }

  /**
   * Wraps data with an integrity header.
   */
  async wrapWithIntegrity(data: unknown) {
    const signature = await this.sign(data);

    return {
      data,
      metadata: {
        signature,
        timestamp: new Date().toISOString(),
        algorithm: 'HMAC-SHA256',
      },
    };
  }
}

export const snapshotIntegrity = SnapshotIntegrity.getInstance();
