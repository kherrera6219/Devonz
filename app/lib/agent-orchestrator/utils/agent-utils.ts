/**
 * Agent Utilities
 *
 * Shared utility functions for all agents in the multi-agent system.
 * Provides error handling, retry logic, and state management helpers.
 */

import type { Runnable } from '@langchain/core/runnables';
import type { RunState, EventLogEntry } from '~/lib/agent-orchestrator/types/mas-schemas';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('AgentUtils');

/**
 * Safely invokes an LLM chain with retries and exponential backoff.
 *
 * @param agentName - Name of the calling agent (for logging)
 * @param chain - The LangChain runnable to invoke
 * @param input - The input to the chain
 * @param retries - Number of retries (default: 3)
 * @param fallback - Optional fallback value if all retries fail
 */
export async function safeInvoke<T>(
  agentName: string,
  chain: Runnable,
  input: any,
  retries: number = 3,
  fallback?: T,
): Promise<T> {
  let attempt = 0;

  while (attempt < retries) {
    try {
      const result = await chain.invoke(input);
      return result as T;
    } catch (error: any) {
      attempt++;
      logger.warn(`Agent ${agentName} failed attempt ${attempt}/${retries}: ${error.message}`);

      // Check for fatal errors that shouldn't be retried
      if (error.message?.includes('context_length_exceeded')) {
        logger.error(`Agent ${agentName} hit fatal context error`);
        break;
      }

      if (attempt >= retries) {
        logger.error(`Agent ${agentName} exhausted retries.`);

        if (fallback !== undefined) {
          return fallback;
        }

        throw error;
      }

      // Exponential backoff
      await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
    }
  }

  if (fallback !== undefined) {
    return fallback;
  }

  throw new Error(`Agent ${agentName} failed after ${retries} attempts`);
}

/**
 * Creates a standard error state for an agent.
 *
 * @param agentName - Name of the agent that encountered the error
 * @param state - Current RunState
 * @param error - The error that occurred
 */
export function createErrorState(agentName: string, state: RunState, error: Error): Partial<RunState> {
  const errorMessage = `${agentName}: ${error.message}`;

  const errorEvent: EventLogEntry = {
    eventId: crypto.randomUUID(),
    runId: state.runId,
    timestamp: new Date().toISOString(),
    type: 'error',
    stage: state.status.stage,
    agent: agentName as any,
    summary: errorMessage,
    visibility: 'user',
    details: { stack: error.stack },
  };

  return {
    status: {
      ...state.status,
      stageState: 'failed',
      activeAgents: state.status.activeAgents.map((a) => (a.agentId === agentName ? { ...a, status: 'error' } : a)),
    },
    errors: [...(state.errors || []), errorMessage],
    events: [errorEvent],
  };
}

/**
 * Format a response for human-readable output.
 * Used by the Orchestrator to present final responses to the user.
 */
export function formatResponseForHuman(response: string, metadata?: Record<string, any>): string {
  let formatted = response;

  // Add metadata context if available
  if (metadata?.tasksCompleted) {
    formatted += `\n\n---\n✅ Completed ${metadata.tasksCompleted} tasks`;
  }

  if (metadata?.filesGenerated) {
    formatted += `\n📁 Generated ${metadata.filesGenerated} files`;
  }

  return formatted;
}
