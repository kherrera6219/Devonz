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
   * In production, this would use 'keytar' or similar for native vault access.
   */
  async setSecret(key: string, value: string): Promise<void> {
    logger.info(`Storing secret for key: ${key}`);

    // For now, we use our authenticated encryption layer for local storage
    const encrypted = encryptionService.encrypt(value);

    // In a real desktop app:
    // if (platform === 'win32') await winVault.set(key, value);

    localStorage.setItem(`secret:${key}`, encrypted);
  }

  /**
   * Retrieves a secret securely.
   */
  async getSecret(key: string): Promise<string | null> {
    const encrypted = localStorage.getItem(`secret:${key}`);

    if (!encrypted) return null;

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
