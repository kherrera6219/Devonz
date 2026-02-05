
import { createGraph } from '~/lib/agent-orchestrator/graph';
import type { BoltState } from '~/lib/agent-orchestrator/state/types';
import type { AgentMessage } from '~/lib/agent-orchestrator/state/types';

export class OrchestratorService {
  private static instance: OrchestratorService;
  private graph: any; // StateGraph compiled workflow

  private constructor() {
    this.graph = createGraph();
  }

  public static getInstance(): OrchestratorService {
    if (!OrchestratorService.instance) {
      OrchestratorService.instance = new OrchestratorService();
    }
    return OrchestratorService.instance;
  }

  async processRequest(
    userRequest: string,
    conversationId: string,
    dataStream: any, // stream-text DataStream
    existingMessages: any[],
    apiKeys: Record<string, string>,
    streamRecovery?: any
  ) {
    // Initial State
    const initialState: Partial<BoltState> = {
      userRequest,
      conversationId,
      messages: existingMessages,
      apiKeys,
      status: 'planning',
      agentMessages: [],
    };

    const config = { configurable: { thread_id: conversationId } };

    try {
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Orchestrator timed out after 5 minutes')), 300000)
        );

        // Create the graph execution promise
        const graphPromise = (async () => {
            const stream = await this.graph.stream(initialState, config);

            for await (const event of stream) {
                // Keep stream alive
                if (streamRecovery) streamRecovery.updateActivity();

                // Analyze event to send progress updates to UI
                // event matches { nodeName: { ...stateUpdates } }

                const nodeName = Object.keys(event)[0];
                const stateUpdate = event[nodeName];

                // Stream thoughts as progress updates
                if (stateUpdate?.thought) {
                    dataStream.writeData({
                        type: 'progress',
                        label: nodeName,
                        status: 'in-progress',
                        message: stateUpdate.thought,
                    });
                }

                // Stream tool actions
                if (stateUpdate?.currentAction) {
                    dataStream.writeData({
                        type: 'progress',
                        label: 'tool',
                        status: 'in-progress',
                        message: `${nodeName.toUpperCase()}: ${stateUpdate.currentAction.description}`,
                        metadata: { tool: stateUpdate.currentAction.type }
                    });
                }

                // Stream plan updates
                if (stateUpdate?.plan) {
                    dataStream.writeData({
                        type: 'progress',
                        label: 'plan',
                        status: 'in-progress',
                        message: `Updated Plan: ${stateUpdate.plan.length} steps identified`,
                        metadata: { plan: stateUpdate.plan }
                    });
                }

                // Stream actual response content to the text stream
                if (stateUpdate?.response) {
                    dataStream.writeText(stateUpdate.response);
                }

                let label = 'agent';
                let message = `Processing: ${nodeName}`;

                if (nodeName === 'coordinator') message = 'Coordinator Planning...';
                if (nodeName === 'researcher') message = 'Researcher Investigating...';
                if (nodeName === 'architect') message = 'Architect Building...';
                if (nodeName.startsWith('qc_')) {
                    label = 'qc';
                    message = `Quality Control: ${nodeName}`;
                }

                // Check for errors in the state update
                if (stateUpdate?.error) {
                    const errMsg = typeof stateUpdate.error === 'string' ? stateUpdate.error : stateUpdate.error.message;
                    dataStream.writeData({
                        type: 'progress',
                        label: 'error',
                        status: 'failed',
                        message: `Agent Error: ${errMsg}`,
                    });
                } else if (!stateUpdate?.thought && !stateUpdate?.currentAction && !stateUpdate?.plan) {
                    // Only send default progress if no specific update was sent
                    dataStream.writeData({
                        type: 'progress',
                        label,
                        status: 'in-progress',
                        message,
                    });
                }
            }
        })();

        // Race the graph execution against the timeout
        await Promise.race([graphPromise, timeoutPromise]);

    } catch (error: any) {
        console.error('Orchestrator Error:', error);

        // Report system-level errors to the UI
        dataStream.writeData({
            type: 'progress',
            label: 'system',
            status: 'failed',
            message: `System Error: ${error.message}`,
        });
    }
  }
}

export const orchestratorService = OrchestratorService.getInstance();
