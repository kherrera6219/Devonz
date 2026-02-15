import { deleteById, getAll, openDatabase } from '../db';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('RetentionEngine');

export interface RetentionPolicy {
  maxAgeDays: number;
  preserveProtected: boolean;
}

/**
 * Data Layer: Retention & Deletion Engine
 * Manages the lifecycle of persistent records and automates purging of expired data.
 */
export class RetentionEngine {
  private static _instance: RetentionEngine;
  private _policy: RetentionPolicy = {
    maxAgeDays: 30, // Default 30-day retention
    preserveProtected: true,
  };

  private constructor() {}

  static getInstance(): RetentionEngine {
    if (!RetentionEngine._instance) {
      RetentionEngine._instance = new RetentionEngine();
    }
    return RetentionEngine._instance;
  }

  setPolicy(policy: Partial<RetentionPolicy>) {
    this._policy = { ...this._policy, ...policy };
    logger.info(`Retention policy updated: ${JSON.stringify(this._policy)}`);
  }

  /**
   * Identifies and purges expired records from the database.
   */
  async purgeExpiredRecords(): Promise<number> {
    const db = await openDatabase();
    if (!db) return 0;

    const chats = await getAll(db);
    const now = Date.now();
    const maxAgeMs = this._policy.maxAgeDays * 24 * 60 * 60 * 1000;

    let purgedCount = 0;

    for (const chat of chats) {
      const chatAge = now - new Date(chat.timestamp).getTime();

      if (chat && chatAge > maxAgeMs) {
        // Check if chat is explicitly protected from deletion if the flag is set
        const metadata = (chat as any).metadata;
        if (this._policy.preserveProtected && metadata?.isProtected) {
          logger.info(`Skipping expiry of protected chat: ${chat.id}`);
          continue;
        }

        try {
          await deleteById(db, chat.id);
          purgedCount++;
          logger.info(`Purged expired chat: ${chat.id} (Age: ${Math.floor(chatAge / (1000 * 60 * 60 * 24))} days)`);
        } catch (error) {
          logger.error(`Failed to purge chat ${chat.id}`, error);
        }
      }
    }

    if (purgedCount > 0) {
      logger.info(`Retention run complete. Purged ${purgedCount} expired records.`);
    }

    return purgedCount;
  }
}

export const retentionEngine = RetentionEngine.getInstance();
