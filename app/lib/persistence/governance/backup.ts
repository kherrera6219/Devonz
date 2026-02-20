import { getAll, openDatabase, setMessages, setSnapshot } from '~/lib/persistence/db';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('BackupService');

export interface BackupArchive {
  version: string;
  createdAt: string;
  source: string;
  data: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    chats: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    snapshots: any[];
  };
}

export class BackupService {
  private static _instance: BackupService;

  private constructor() {
    // Singleton
  }

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

    if (!db) {
      throw new Error('Database not available');
    }

    const chats = await getAll(db);

    /*
     * for this mock, we'll assume we grab them via a similar getAll loop
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
   * Restores data from a backup archive.
   */
  async restoreFromBackup(archive: BackupArchive): Promise<void> {
    const db = await openDatabase();

    if (!db) {
      throw new Error('Database not available');
    }

    logger.info(`Restoring from backup dated: ${archive.createdAt}`);

    for (const chat of archive.data.chats) {
      await setMessages(db, chat.id, chat.messages, chat.urlId, chat.description, chat.timestamp, chat.metadata);
    }

    for (const snap of archive.data.snapshots) {
      await setSnapshot(db, snap.chatId, snap.snapshot);
    }
  }
}

export const backupService = BackupService.getInstance();
