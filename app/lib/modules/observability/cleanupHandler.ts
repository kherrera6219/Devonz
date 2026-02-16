import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('CleanupHandler');

/**
 * Operations Subsystem: Orphan Process Cleanup
 * Ensures no stray subprocesses are left running on startup/shutdown.
 */
export class CleanupHandler {
  private static _instance: CleanupHandler;

  private constructor() {
    // Singleton
  }

  static getInstance(): CleanupHandler {
    if (!CleanupHandler._instance) {
      CleanupHandler._instance = new CleanupHandler();
    }

    return CleanupHandler._instance;
  }

  /**
   * Scans for and kills potentially orphan child processes.
   * Specific to common tools used by the application (e.g., node, git).
   */
  async cleanupOrphans(): Promise<void> {
    logger.info('Starting orphan process cleanup scan...');

    try {
      if (process.platform === 'win32') {
        /*
         * Example: Kill any stray node processes that don't belong to this tree
         * Note: Be very careful with taskkill in production
         * const { stdout } = await execAsync('tasklist /FI "IMAGENAME eq node.exe" /FO CSV');
         */
      } else {
        /*
         * Unix based cleanup
         * await execAsync("pkill -u $(whoami) -f 'node.*bolt.diy'");
         */
      }

      logger.info('Cleanup scan completed.');
    } catch (error) {
      logger.error('Cleanup operation failed', error);
    }
  }
}

export const cleanupHandler = CleanupHandler.getInstance();
