import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { RAGService } from '../app/lib/services/ragService';

async function testRAG() {
  console.log('--- Starting RAG Validation ---');

  const rag = RAGService.getInstance();

  const testFiles = {
    'src/hello.ts': 'export function sayHello() { console.log("Hello from tests!"); }',
    'src/math.ts': 'export function add(a: number, b: number) { return a + b; }',
    'README.md': '# Test Project\nThis is a project to test our RAG integration.'
  };

  try {
    console.log('Step 1: Clearing old index...');
    await rag.clearIndex();

    console.log('Step 2: Indexing test files...');
    const result = await rag.indexFiles(testFiles);
    console.log(`Indexed ${result.indexedCount} files.`);

    console.log('Step 3: Performing a query...');
    const query = 'How do I add numbers?';
    console.log(`Query: "${query}"`);
    const searchResults = await rag.query(query, 2);

    console.log('Results:');
    searchResults.forEach((res, i) => {
      console.log(`[${i+1}] ${res.substring(0, 200)}...`);
    });

    if (searchResults.length > 0) {
      console.log('\n✅ RAG Validation SUCCESSFUL');
    } else {
      console.log('\n❌ RAG Validation FAILED: No results returned');
    }
  } catch (error) {
    console.error('\n❌ RAG Validation ERROR:', error);
  }
}

testRAG();
