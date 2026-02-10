import path from 'node:path';
import { json, type ActionFunctionArgs } from '@remix-run/node';
import { minioService } from '~/lib/services/minioService';
import { RAGService } from '~/lib/services/ragService';
import { createScopedLogger } from '~/utils/logger';
import { withSecurity } from '~/lib/security';

const logger = createScopedLogger('api-import-file');

// Maximum file size: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024;

/**
 * Sanitize and validate a file path to prevent directory traversal attacks.
 * Returns null if the path is invalid/malicious.
 */
function sanitizeFilePath(rawPath: string): string | null {
  if (!rawPath || typeof rawPath !== 'string') {
    return null;
  }

  // Reject null bytes (used in some path traversal attacks)
  if (rawPath.includes('\0')) {
    return null;
  }

  // Reject absolute paths
  if (path.isAbsolute(rawPath) || rawPath.startsWith('/') || /^[a-zA-Z]:/.test(rawPath)) {
    return null;
  }

  // Normalize and split
  const normalized = path.normalize(rawPath);

  // After normalization, reject if it tries to escape
  if (normalized.startsWith('..') || normalized.includes('..')) {
    return null;
  }

  // Split, filter dangerous segments, rejoin
  const parts = normalized
    .split(/[/\\]/)
    .filter((part) => part !== '' && part !== '.' && part !== '..');

  if (parts.length === 0) {
    return null;
  }

  return parts.join('/');
}

export const action = withSecurity(
  async ({ request }: ActionFunctionArgs) => {
    try {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const rawPath = formData.get('path') as string;
      const isBinary = formData.get('isBinary') === 'true';

      if (!file || !rawPath) {
        return json({ error: 'Missing file or path' }, { status: 400 });
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return json({ error: 'File too large. Maximum size is 50MB.' }, { status: 413 });
      }

      // Security: Sanitize path to prevent traversal
      const safePath = sanitizeFilePath(rawPath);

      if (!safePath) {
        return json({ error: 'Invalid file path' }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const defaultProjectId = '00000000-0000-0000-0000-000000000000'; // Default legacy project

      // Phase 1: Store in MinIO
      await minioService.uploadFile(safePath, buffer, file.type, defaultProjectId);

      // Phase 2: Index in RAG (only for text files)
      if (!isBinary) {
        const content = buffer.toString('utf-8');
        const ragService = RAGService.getInstance();
        await ragService.indexFiles(defaultProjectId, { [safePath]: content });
      }

      return json({ success: true });
    } catch (error) {
      logger.error('Import file failed', error);
      return json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
  { allowedMethods: ['POST'], rateLimit: true },
);
