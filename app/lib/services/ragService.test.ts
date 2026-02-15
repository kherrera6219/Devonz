// @vitest-environment node
import { describe, it, expect } from 'vitest';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

/**
 * RAGService integration tests.
 * Requires a running PostgreSQL instance with pgvector and DATABASE_URL set.
 * Gracefully passes when the database is unreachable.
 */
describe('RAGService Validation', () => {
  it('should initialize, clear, index and query', async () => {
    if (!process.env.DATABASE_URL) {
      console.log('⏭ Skipping RAG test: DATABASE_URL not configured');
      return;
    }

    try {
      const { RAGService } = await import('./ragService');
      const rag = RAGService.getInstance();

      // 1. Clear
      await rag.clearIndex();
      console.log('Index cleared.');

      // 2. Index
      const testFiles = {
        'test-file.ts': 'export const secret = "the magic word is bird";',
      };
      const projectId = 'test-project-1';
      const indexedCount = await rag.indexFiles(projectId, testFiles);

      expect(indexedCount).toBe(1);
      console.log('Indexed 1 file.');

      // 3. Query
      const results = await rag.query(projectId, 'What is the magic word?', 1);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toContain('bird');
      console.log('Query successful, found content:', results[0]);
    } catch (error) {
      const msg =
        error instanceof AggregateError
          ? error.errors.map((e) => e.message).join('; ')
          : error instanceof Error
            ? error.message
            : String(error);

      // Skip gracefully on connection errors (database not running)
      if (msg.includes('ECONNREFUSED') || msg.includes('ENOTFOUND') || msg.includes('connect')) {
        console.log(`⏭ Skipping RAG test: database unreachable (${msg})`);
        return;
      }

      // Re-throw any non-connection errors
      throw error;
    }
  }, 30000);
});
