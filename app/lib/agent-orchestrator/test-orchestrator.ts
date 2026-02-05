import * as dotenv from 'dotenv';
import { createGraph } from './graph';
import type { BoltState } from './state/types';

// Load env vars from .env.local or .env
dotenv.config({ path: '.env.local' });
dotenv.config();

async function runTest() {
  console.log('--- Starting Multi-Agent Orchestration Test ---');

  const graph = createGraph();

  const initialState: Partial<BoltState> = {
    userRequest: 'Build a robust React contact form with client-side validation using Zod and a dark-theme UI.',
    status: 'idle',
    qcIteration: 0,
    maxQcIterations: 3,
    messages: [],
    agentMessages: [],
  };

  console.log('User Request:', initialState.userRequest);
  console.log('----------------------------------------------');

  try {
    // We stream updates to see the intermediate thoughts/actions
    const stream = await graph.stream(initialState, {
      recursionLimit: 50,
    });

    for await (const update of stream) {
      const nodeName = Object.keys(update)[0];
      const stateUpdate = (update as Record<string, Partial<BoltState>>)[nodeName];

      if (stateUpdate) {
        console.log(`\n[NODE: ${nodeName.toUpperCase()}]`);

        if (stateUpdate.thought) {
          console.log(`> Thought: ${stateUpdate.thought}`);
        }

        if (stateUpdate.plan && stateUpdate.plan.length > 0) {
          console.log('> Plan Identified:');
          stateUpdate.plan.forEach((step, i) => console.log(`  ${i + 1}. ${step}`));
        }

        if (stateUpdate.currentAction) {
          console.log(`> Action: [${stateUpdate.currentAction.type}] ${stateUpdate.currentAction.description}`);
        }

        if (stateUpdate.status) {
          console.log(`> Status: ${stateUpdate.status}`);
        }

        if (stateUpdate.error) {
          console.log(
            `> ERROR: ${typeof stateUpdate.error === 'object' ? JSON.stringify(stateUpdate.error, null, 2) : stateUpdate.error}`,
          );
        }

        if (stateUpdate.response) {
          console.log(`> Final Response: ${stateUpdate.response}`);
        }
      }
    }

    console.log('\n--- Test Completed Successfully ---');
  } catch (error: any) {
    console.error('\n!!! Orchestration Error:', error.message);
    if (error.stack) {
      // console.error(error.stack);
    }
  }
}

runTest().catch(console.error);
