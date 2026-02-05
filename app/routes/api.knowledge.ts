import { json, type ActionFunctionArgs } from '@remix-run/node';
import { knowledgeService } from '~/lib/services/knowledgeService';
import { createScopedLogger } from '~/utils/logger';
import { withSecurity } from '~/lib/security';

const logger = createScopedLogger('api.knowledge');

export const action = withSecurity(async ({ request }: ActionFunctionArgs) => {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  try {
    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return json({ error: 'Missing projectId' }, { status: 400 });
    }

    switch (action) {
      case 'ingest': {
        const { files } = body; // Record<string, string>

        if (!files) {
          return json({ error: 'Missing files' }, { status: 400 });
        }

        await knowledgeService.ingestProject(projectId, files);

        return json({ success: true });
      }

      case 'query': {
        const { query, topK } = body;

        if (!query) {
          return json({ error: 'Missing query' }, { status: 400 });
        }

        const results = await knowledgeService.query(projectId, query, topK);

        return json({ results });
      }

      case 'delete': {
        await knowledgeService.deleteProject(projectId);
        return json({ success: true });
      }

      default:
        return json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    logger.error(`Knowledge API failed for action: ${action}`, error);
    return json({ error: String(error) }, { status: 500 });
  }
});
