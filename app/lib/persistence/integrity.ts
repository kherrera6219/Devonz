import crypto from 'node:crypto';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('DataIntegrity');

// In production, this should be a secure environment variable (APP_SECRET)
const INTEGRITY_SECRET = process.env.APP_SECRET || 'dev-integrity-secret-2026';

/**
 * Data Layer: Snapshot Integrity System
 * Provides HMAC-SHA256 signing and verification for chat snapshots.
 */
export class SnapshotIntegrity {
  private static _instance: SnapshotIntegrity;

  private constructor() {}

  static getInstance(): SnapshotIntegrity {
    if (!SnapshotIntegrity._instance) {
      SnapshotIntegrity._instance = new SnapshotIntegrity();
    }

    return SnapshotIntegrity._instance;
  }

  /**
   * Signs a snapshot object and returns the HMAC signature.
   */
  sign(data: any): string {
    const serialized = JSON.stringify(data);
    return crypto.createHmac('sha256', INTEGRITY_SECRET).update(serialized).digest('hex');
  }

  /**
   * Verifies the integrity of a snapshot using its signature.
   */
  verify(data: any, signature: string): boolean {
    const expected = this.sign(data);

    // Constant-time comparison to prevent timing attacks
    const isValid = crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));

    if (!isValid) {
      logger.error('Data Integrity Violation: Snapshot signature mismatch!');
    }

    return isValid;
  }

  /**
   * Wraps data with an integrity header.
   */
  wrapWithIntegrity(data: any) {
    return {
      data,
      metadata: {
        signature: this.sign(data),
        timestamp: new Date().toISOString(),
        algorithm: 'HMAC-SHA256',
      },
    };
  }
}

export const snapshotIntegrity = SnapshotIntegrity.getInstance();
