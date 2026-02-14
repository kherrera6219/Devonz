import { longTermMemory } from '../app/lib/services/longTermMemoryService';
import path from 'path';
import { promises as fs } from 'fs';

async function testMemory() {
  const projectRoot = process.cwd();
  console.log('🧪 Testing LongTermMemoryService...');

  // 1. Initialize
  await longTermMemory.initialize(projectRoot);

  // 2. Add Entry
  const entry = {
    category: 'DECISION' as const,
    timestamp: new Date().toISOString(),
    content: 'Unit test execution verified successful memory persistence.',
  };

  await longTermMemory.addEntry(projectRoot, entry);
  console.log('✅ Entry added.');

  // 3. Read Back
  const context = await longTermMemory.getMemoryContext(projectRoot);

  if (context.includes('Unit test execution verified')) {
    console.log('✅ Memory recall successful!');
    console.log('--- Context Preview ---');
    console.log(context.substring(0, 200) + '...');
  } else {
    console.error('❌ Memory recall failed.');
    process.exit(1);
  }
}

testMemory().catch(console.error);
