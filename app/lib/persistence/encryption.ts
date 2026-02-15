import crypto from 'node:crypto';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('Encryption');

// In production, this should be a 32-byte secure key from environment (ENCRYPTION_KEY)
const ENCRYPTION_SECRET = process.env.ENCRYPTION_KEY || 'dev-encryption-key-2026-secret-32';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard for GCM
const AUTH_TAG_LENGTH = 16;

/**
 * Data Layer: Encryption-at-Rest
 * Provides authenticated encryption for sensitive data fields.
 */
export class EncryptionService {
  private static _instance: EncryptionService;

  private constructor() {}

  static getInstance(): EncryptionService {
    if (!EncryptionService._instance) {
      EncryptionService._instance = new EncryptionService();
    }

    return EncryptionService._instance;
  }

  /**
   * Encrypts plain text into a secure format (iv:ciphertext:authTag).
   */
  encrypt(text: string): string {
    try {
      const iv = crypto.randomBytes(IV_LENGTH);

      // Ensure key is 32 bytes for AES-256
      const key = crypto.createHash('sha256').update(ENCRYPTION_SECRET).digest();
      const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag().toString('hex');

      return `${iv.toString('hex')}:${encrypted}:${authTag}`;
    } catch (error) {
      logger.error('Encryption failed', error);
      throw new Error('Data encryption failed');
    }
  }

  /**
   * Decrypts encrypted data back to plain text.
   */
  decrypt(encryptedData: string): string {
    try {
      const [ivHex, encrypted, authTagHex] = encryptedData.split(':');

      if (!ivHex || !encrypted || !authTagHex) {
        throw new Error('Invalid encrypted data format');
      }

      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const key = crypto.createHash('sha256').update(ENCRYPTION_SECRET).digest();

      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      logger.error('Decryption failed', error);
      throw new Error('Data decryption failed (likely invalid key or tampered data)');
    }
  }
}

export const encryptionService = EncryptionService.getInstance();
