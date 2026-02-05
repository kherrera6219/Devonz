import { json, type ActionFunctionArgs } from '@remix-run/node';
import { minioService } from '~/lib/services/minioService';
import { RAGService } from '~/lib/services/ragService';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('api-import-file');

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const path = formData.get('path') as string;
    const isBinary = formData.get('isBinary') === 'true';

    if (!file || !path) {
      return json({ error: 'Missing file or path' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Phase 1: Store in MinIO
    await minioService.uploadFile(path, buffer, file.type);

    // Phase 2: Index in RAG (only for text files)
    if (!isBinary) {
      const content = buffer.toString('utf-8');
      const ragService = RAGService.getInstance();
      await ragService.indexFiles({ [path]: content });
    }

    return json({ success: true });
  } catch (error) {
    logger.error('Import file failed', error);
    return json({ error: String(error) }, { status: 500 });
  }
}
