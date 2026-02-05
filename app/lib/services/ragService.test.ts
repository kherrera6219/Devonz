import { describe, it, expect, beforeAll } from 'vitest';
import { RAGService } from './ragService';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

describe('RAGService Validation', () => {
  let rag: RAGService;

  beforeAll(() => {
    rag = RAGService.getInstance();
  });

  it('should initialize, clear, index and query', async () => {
    console.log('Starting RAG test...');

    // 1. Clear
    await rag.clearIndex();
    console.log('Index cleared.');

    // 2. Index
    const testFiles = {
      'test-file.ts': 'export const secret = "the magic word is bird";'
    };
    const projectId = 'test-project-1';
    const indexedCount = await rag.indexFiles(projectId, testFiles);

    if (indexedCount === 0) {
      console.error('Indexing failed or returned 0');
    }

    expect(indexedCount).toBe(1);
    console.log('Indexed 1 file.');


    // 3. Query
    const results = await rag.query(projectId, 'What is the magic word?', 1);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toContain('bird');
    console.log('Query successful, found content:', results[0]);
  }, 30000); // 30s timeout for RAG ops
});
