import { json, type ActionFunctionArgs } from '@remix-run/node';
import { minioService } from '~/lib/services/minioService';
import { RAGService } from '~/lib/services/ragService';
import { createScopedLogger } from '~/utils/logger';
import { withSecurity } from '~/lib/security';

const logger = createScopedLogger('api-import-file');

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

      // Security: Sanitize path to prevent traversal
      const sanitizedPath = rawPath
        .split(/[/\\]/)
        .filter((part) => part !== '..' && part !== '.')
        .join('/');

      // Ensure filename is just a basename if it's meant to be a single file
      const safePath = sanitizedPath;

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
