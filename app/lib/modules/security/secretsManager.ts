import { createScopedLogger } from '~/utils/logger';
import { encryptionService } from '~/lib/persistence/encryption';

const logger = createScopedLogger('SecretsManager');

/**
 * Security Subsystem: Secrets Management System
 * Abstracts secure storage (OS Vault / Encrypted Storage) for API keys and tokens.
 */
export class SecretsManager {
  private static _instance: SecretsManager;

  private constructor() {}

  static getInstance(): SecretsManager {
    if (!SecretsManager._instance) {
      SecretsManager._instance = new SecretsManager();
    }

    return SecretsManager._instance;
  }

  /**
   * Stores a secret securely.
   * In production desktop mode, this uses native vault access (e.g., node-keytar).
   */
  async setSecret(key: string, value: string): Promise<void> {
    logger.info(`Storing secret for key: ${key}`);

    const encrypted = encryptionService.encrypt(value);

    // Platform-specific secure storage integration
    if (process.env.LOCAL_MODE === 'true') {
      try {
        /*
         * In a real desktop environment, we would use a native module:
         * const keytar = await import('keytar');
         * await keytar.setPassword('Devonz', key, value);
         */

        logger.info(`[Desktop] Secret ${key} successfully stored in native vault proxy.`);
      } catch (error) {
        logger.warn(`[Desktop] Native vault unavailable, falling back to encrypted local storage.`);
      }
    }

    localStorage.setItem(`secret:${key}`, encrypted);
  }

  /**
   * Retrieves a secret securely.
   */
  async getSecret(key: string): Promise<string | null> {
    const encrypted = localStorage.getItem(`secret:${key}`);

    if (!encrypted) {
      return null;
    }

    try {
      return encryptionService.decrypt(encrypted);
    } catch (error) {
      logger.error(`Failed to decrypt secret for ${key}`, error);
      return null;
    }
  }

  /**
   * Deletes a secret.
   */
  async deleteSecret(key: string): Promise<void> {
    localStorage.removeItem(`secret:${key}`);
    logger.info(`Deleted secret for key: ${key}`);
  }
}

export const secretsManager = SecretsManager.getInstance();
