import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('Encryption');
const ENCODER = new TextEncoder();
const DECODER = new TextDecoder();

// In production, this should be a 32-byte secure key from environment (VITE_ENCRYPTION_KEY)
const ENCRYPTION_SECRET = import.meta.env.VITE_ENCRYPTION_KEY || 'dev-encryption-key-2026-secret-32';
const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12; // Standard for GCM

/**
 * Data Layer: Encryption-at-Rest
 * Provides authenticated encryption for sensitive data fields.
 * Uses Web Crypto API for browser compatibility.
 */
export class EncryptionService {
  private static _instance: EncryptionService;
  private _key: CryptoKey | null = null;

  private constructor() {}

  static getInstance(): EncryptionService {
    if (!EncryptionService._instance) {
      EncryptionService._instance = new EncryptionService();
    }

    return EncryptionService._instance;
  }

  private async getKey(): Promise<CryptoKey> {
    if (this._key) {
      return this._key;
    }

    const secretBuffer = ENCODER.encode(ENCRYPTION_SECRET);
    const hash = await crypto.subtle.digest('SHA-256', secretBuffer);

    this._key = await crypto.subtle.importKey(
      'raw',
      hash,
      ALGORITHM,
      false,
      ['encrypt', 'decrypt'],
    );

    return this._key;
  }

  /**
   * Encrypts plain text into a secure format (iv:ciphertext).
   * Note: WebCrypto AES-GCM includes the AuthTag in the ciphertext output.
   */
  async encrypt(text: string): Promise<string> {
    try {
      const key = await this.getKey();
      const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
      const encodedText = ENCODER.encode(text);

      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: ALGORITHM, iv },
        key,
        encodedText,
      );

      const ivHex = Array.from(iv).map((b) => b.toString(16).padStart(2, '0')).join('');
      const cipherHex = Array.from(new Uint8Array(encryptedBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      return `${ivHex}:${cipherHex}`;
    } catch (error) {
      logger.error('Encryption failed', error);
      throw new Error('Data encryption failed');
    }
  }

  /**
   * Decrypts encrypted data back to plain text.
   */
  async decrypt(encryptedData: string): Promise<string> {
    try {
      const parts = encryptedData.split(':');

      /*
       * Support legacy format if necessary, though unused currently.
       * New format: iv:ciphertext (where ciphertext includes auth tag)
       */
      const [ivHex, cipherHex] = parts;

      if (!ivHex || !cipherHex) {
        throw new Error('Invalid encrypted data format');
      }

      const key = await this.getKey();

      // Hex to Uint8Array
      const iv = new Uint8Array(
        ivHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)),
      );
      const ciphertext = new Uint8Array(
        cipherHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)),
      );

      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: ALGORITHM, iv },
        key,
        ciphertext,
      );

      return DECODER.decode(decryptedBuffer);
    } catch (error) {
      logger.error('Decryption failed', error);
      throw new Error('Data decryption failed (likely invalid key or tampered data)');
    }
  }
}

export const encryptionService = EncryptionService.getInstance();
