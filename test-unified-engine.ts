import { knowledgeService } from './app/lib/services/knowledgeService';
import { createScopedLogger } from './app/utils/logger';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const logger = createScopedLogger('test-unified-engine');

async function test() {
  const projectA = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const projectB = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  const filesA = {
    'auth.ts': 'export const login = () => "logged in";',
    'api.ts': 'import { login } from "./auth.ts"; export const callData = () => login();',
  };

  const filesB = {
    'utils.ts': 'export const format = (d: any) => d.toString();',
    'service.ts': 'import { format } from "./utils.ts"; export const run = () => format(Date.now());',
  };

  try {
    logger.info('--- Phase 1: Ingestion ---');
    logger.info('Ingesting Project A...');
    await knowledgeService.ingestProject(projectA, filesA);
    logger.info('Ingesting Project B...');
    await knowledgeService.ingestProject(projectB, filesB);

    logger.info('--- Phase 2: Isolation Check ---');
    const queryA = await knowledgeService.query(projectA, 'How do I login?');
    const queryB = await knowledgeService.query(projectB, 'How do I login?');

    console.log('\nQuery A Results (Project A):');
    queryA.forEach(r => console.log(`- ${r.split('\n')[0]}`));

    console.log('\nQuery B Results (Project B - Should be empty for login):');
    queryB.forEach(r => console.log(`- ${r.split('\n')[0]}`));

    if (queryB.some(r => r.includes('auth.ts'))) {
      logger.error('CRITICAL: Data Leakage Detected! Project B saw Project A data.');
    } else {
      logger.info('SUCCESS: Project isolation verified.');

      logger.info('--- Phase 3: Graph Check ---');
      const subgraphA = await knowledgeService.getProjectSubgraph(projectA);
      console.log('\nSubgraph A Relationships:');
      subgraphA.forEach((rel: any) => console.log(`- ${rel.source.path} --[${rel.relationship}]--> ${rel.target.path}`));

      logger.info('--- Phase 4: Cleanup ---');
      // await knowledgeService.deleteProject(projectA);
      // await knowledgeService.deleteProject(projectB);
      logger.info('Verification script completed.');
    }
  } catch (error) {
    logger.error('Verification failed', error);
  } finally {
    const { graphService } = await import('./app/lib/services/graphService');
    await graphService.close();
  }
}

test().catch(console.error);
