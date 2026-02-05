import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { RAGService } from './app/lib/services/ragService.ts';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testRAG() {
  const ragService = RAGService.getInstance();
  console.log('Initializing RAG Service...');

  try {
    console.log('Indexing test file...');
    await ragService.indexFiles({
      'diagnostic-test.ts': 'export const diagnosticValue = "RAG_WIRING_SUCCESSFUL";'
    });

    console.log('Querying RAG...');
    const results = await ragService.query('diagnosticValue');

    console.log('RAG Query Results:');
    results.forEach((res, i) => console.log(`Result ${i + 1}:\n${res}`));

    if (results.some(r => r.includes('RAG_WIRING_SUCCESSFUL'))) {
      console.log('✅ RAG wiring and indexing verified successfully!');
    } else {
      console.log('❌ RAG query returned no matching results.');
    }
  } catch (error) {
    console.error('❌ RAG test failed:', error);
  }
}

testRAG();
