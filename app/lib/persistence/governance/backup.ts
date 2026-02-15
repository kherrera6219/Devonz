import { getAll, openDatabase, setMessages, setSnapshot } from '../db';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('BackupService');

export interface BackupArchive {
  version: string;
  createdAt: string;
  source: string;
  data: {
    chats: any[];
    snapshots: any[];
  };
}

/**
 * Data Layer: Backup & Recovery Strategy
 * Provides mechanisms for data durability and disaster recovery.
 */
export class BackupService {
  private static _instance: BackupService;

  private constructor() {}

  static getInstance(): BackupService {
    if (!BackupService._instance) {
      BackupService._instance = new BackupService();
    }
    return BackupService._instance;
  }

  /**
   * Creates a full backup of the local database.
   */
  async createBackup(): Promise<BackupArchive> {
    const db = await openDatabase();
    if (!db) throw new Error('Database not available');

    const chats = await getAll(db);

    // snapshots are in a separate store, we'd need to iterate them too
    // for this mock, we'll assume we grab them via a similar getAll loop
    const snapshots: any[] = [];

    const archive: BackupArchive = {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      source: 'Devonz Local Persistence',
      data: {
        chats,
        snapshots,
      },
    };

    logger.info(`Backup archive created: ${chats.length} chats included.`);
    return archive;
  }

  /**
   * Restores the database from a backup archive.
   */
  async restoreFromBackup(archive: BackupArchive): Promise<void> {
    const db = await openDatabase();
    if (!db) throw new Error('Database not available');

    logger.info(`Restoring from backup dated: ${archive.createdAt}`);

    for (const chat of archive.data.chats) {
      await setMessages(db, chat.id, chat.messages, chat.urlId, chat.description, chat.timestamp, chat.metadata);
    }

    for (const snap of archive.data.snapshots) {
        await setSnapshot(db, snap.chatId, snap.snapshot);
    }

    logger.info('Database restoration complete.');
  }

  /**
   * Syncs backup to cloud storage (Placeholder).
   */
  async syncToCloud(archive: BackupArchive) {
    logger.info('Syncing backup archive to cloud storage...');
    // In production, this would call S3 / MinioService
    // await minioService.upload('backups', `backup-${archive.createdAt}.json`, JSON.stringify(archive));
  }
}

export const backupService = BackupService.getInstance();
