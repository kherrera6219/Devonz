import { getMessages, getSnapshot, openDatabase } from '~/lib/persistence/db';
import { snapshotIntegrity } from '~/lib/persistence/integrity';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('EvidenceExporter');

/**
 * Data Layer: Data Export & Evidence Packaging
 * Packages chat histories into verifiable evidence bundles.
 */
export class EvidenceExporter {
  private static _instance: EvidenceExporter;

  private constructor() {
    // Singleton
  }

  static getInstance(): EvidenceExporter {
    if (!EvidenceExporter._instance) {
      EvidenceExporter._instance = new EvidenceExporter();
    }

    return EvidenceExporter._instance;
  }

  /**
   * Exports a complete chat history and its snapshots as a secure evidence bundle.
   */
  async exportChatAsBundle(chatId: string): Promise<string> {
    const db = await openDatabase();

    if (!db) {
      throw new Error('Database not available');
    }

    const chat = await getMessages(db, chatId);

    if (!chat) {
      throw new Error(`Chat ${chatId} not found`);
    }

    const snapshot = await getSnapshot(db, chatId);

    const bundle = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      source: 'Devonz AI Governance System',
      chat: {
        id: chat.id,
        messages: chat.messages,
        metadata: chat.metadata,
      },
      snapshots: snapshot ? [snapshot] : [],
      integrity: {
        chatSignature: snapshotIntegrity.sign(chat),
        snapshotSignature: snapshot ? snapshotIntegrity.sign(snapshot) : null,
      },
    };

    logger.info(`Evidence bundle generated for chat ${chatId}`);

    /*
     * In a real browser implementation, this might trigger a file download
     * For now, we return the JSON string.
     */
    return JSON.stringify(bundle, null, 2);
  }
}

export const evidenceExporter = EvidenceExporter.getInstance();
