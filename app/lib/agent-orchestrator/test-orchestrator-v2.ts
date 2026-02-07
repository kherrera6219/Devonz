import { OrchestratorService } from '~/lib/services/orchestratorService';

// @ts-ignore - EventBus and State types are complex and being aligned
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Mock environment setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../../../.env.local') });

// Mock DataStream for verification
class MockDataStream {
  events: any[] = [];

  writeData(data: any) {
    console.log('Stream Data:', JSON.stringify(data));
    this.events.push(data);
  }

  writeText(_text: string) {
    // console.log('Stream Text:', _text);
  }
}

async function main() {
  console.log('Starting V2 Orchestrator Verification Run...');

  const orchestrator = OrchestratorService.getInstance();
  const mockStream = new MockDataStream();

  const userRequest = 'Create a simple README file for a calculator app.';
  const conversationId = 'test-run-v2-' + Date.now();

  try {
    await orchestrator.processRequest(
      userRequest,
      conversationId,
      mockStream,
      [], // No history
      {}, // No extra keys
      {
        updateActivity: () => {
          /* intentional no-op for mock */
        },
      }, // Mock stream recovery
    );

    console.log('\n--- Run Completed ---');
    console.log('Total Events:', mockStream.events.length);

    // Verification Logic
    const eventTypes = mockStream.events.map((e) => (e.type === 'event_log' ? e.payload.type : e.type));
    console.log('Event Sequence:', eventTypes);

    const hasRunStarted = eventTypes.includes('run_started');
    const hasPlanStage = eventTypes.includes('stage_started'); // Should observe 'stage_started' for PLANNING

    if (hasRunStarted && hasPlanStage) {
      console.log('✅ Final Verification Passed: V1 Event Bus is active.');
    } else {
      console.error('❌ Verification Failed: Missing critical events.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Run failed:', error);
    process.exit(1);
  }
}

main();
