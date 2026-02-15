import path from 'node:path';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('FileSanitizer');

/**
 * Connector Subsystem: File Sanitization & Path Validation
 * Protects against path traversal and secures file operations.
 */
export class FileSanitizer {
  private static _instance: FileSanitizer;

  private constructor() {}

  static getInstance(): FileSanitizer {
    if (!FileSanitizer._instance) {
      FileSanitizer._instance = new FileSanitizer();
    }
    return FileSanitizer._instance;
  }

  /**
   * Validates a path to ensure it stays within a target root directory.
   */
  validatePath(root: string, targetPath: string): string {
    const absoluteRoot = path.resolve(root);
    const absoluteTarget = path.resolve(root, targetPath);

    if (!absoluteTarget.startsWith(absoluteRoot)) {
      logger.error(`Security Violation: Path traversal attempt detected! Root: ${absoluteRoot}, Target: ${absoluteTarget}`);
      throw new Error('Path traversal is not allowed.');
    }

    return absoluteTarget;
  }

  /**
   * Sanitizes a filename to remove dangerous characters.
   */
  sanitizeFilename(filename: string): string {
    // Remove control characters, null bytes, and path separators
    return filename
      .replace(/[\x00-\x1f\x7f]/g, '')
      .replace(/[\\/:*?"<>|]/g, '_')
      .trim()
      .slice(0, 255); // Max length for most filesystems
  }
}

export const fileSanitizer = FileSanitizer.getInstance();
