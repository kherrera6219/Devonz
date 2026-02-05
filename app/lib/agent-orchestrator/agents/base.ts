import { Runnable } from '@langchain/core/runnables';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import type { BoltState } from '~/lib/agent-orchestrator/state/types';
import { MessageFactory } from '~/lib/agent-orchestrator/utils/message-factory';
import { logger } from '~/utils/logger';

export abstract class BaseAgent {
  protected abstract name: string;

  /**
   * Safely invokes an LLM chain with retries and error handling.
   * @param chain The LangChain runnable to invoke
   * @param input The input to the chain
   * @param retries Number of retries (default: 3)
   * @param fallback Optional fallback value if all retries fail
   */
  protected async safeInvoke<T>(chain: Runnable, input: any, retries: number = 3, fallback?: T): Promise<T> {
    let attempt = 0;

    while (attempt < retries) {
      try {
        const result = await chain.invoke(input);
        return result as T;
      } catch (error: any) {
        attempt++;
        logger.warn(`Agent ${this.name} failed attempt ${attempt}/${retries}: ${error.message}`);

        // Check for fatal errors that shouldn't be retried (e.g. context length)
        if (error.message?.includes('context_length_exceeded')) {
          logger.error(`Agent ${this.name} hit fatal context error`);
          break;
        }

        if (attempt >= retries) {
          logger.error(`Agent ${this.name} exhausted retries.`);
          if (fallback !== undefined) return fallback;
          throw error;
        }

        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }

    if (fallback !== undefined) return fallback;
    throw new Error(`Agent ${this.name} failed after ${retries} attempts`);
  }

  /**
   * Creates a standard error state for the agent
   */
  protected createErrorState(state: BoltState, error: Error): Partial<BoltState> {
    return {
      status: 'error',
      error: {
        message: error.message,
        agent: this.name,
        timestamp: Date.now(),
      },
      agentMessages: [
        ...state.agentMessages,
        MessageFactory.text(this.name as any, 'coordinator', `Error: ${error.message}`),
      ],
    };
  }
}
