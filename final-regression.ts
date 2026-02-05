import { knowledgeService } from './app/lib/services/knowledgeService';
import { createScopedLogger } from './app/utils/logger';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const logger = createScopedLogger('final-regression-test');

async function test() {
  const projectId = 'test-opt-' + Date.now();

  const files = {
    'folder/utils.ts': 'export const x = 1;',
    'main.ts': 'import { x } from "./folder/utils.ts"; console.log(x);',
  };

  try {
    logger.info('Testing Optimized Ingestion...');
    await knowledgeService.ingestProject(projectId, files);

    logger.info('Verifying Subgraph Accuracy...');
    const subgraph = await knowledgeService.getProjectSubgraph(projectId);
    console.log('\nRelationships:');
    subgraph.forEach((rel: any) => console.log(`- ${rel.source.path} -> ${rel.target.path}`));

    const hasDependency = subgraph.some((rel: any) =>
      rel.source.path === 'main.ts' && rel.target.path.includes('utils')
    );

    if (hasDependency) {
      logger.info('SUCCESS: Dependency correctly identified.');
    } else {
      logger.warn('WARNING: Dependency NOT identified. Check regex/normalization.');
    }

    logger.info('Testing Batch Deletion...');
    await knowledgeService.deleteProject(projectId);
    logger.info('Cleanup complete.');

  } catch (error) {
    logger.error('Regression failed', error);
  } finally {
    const { graphService } = await import('./app/lib/services/graphService');
    await graphService.close();
  }
}

test().catch(console.error);
