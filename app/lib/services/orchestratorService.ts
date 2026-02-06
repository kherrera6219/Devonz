
import { createGraph } from '~/lib/agent-orchestrator/graph';
import type { RunState } from '~/lib/agent-orchestrator/types/mas-schemas';

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
    // Initial State (RunState)
    const initialState: Partial<RunState> = {
      runId: crypto.randomUUID(),
      conversationId,
      userId: 'user', // placeholder
      createdAt: new Date().toISOString(),
      mode: '3agent_strict',
      inputs: {
        requestText: userRequest,
        constraints: {
             language: 'typescript',
             securityLevel: 'normal',
             testLevel: 'standard'
        }
      },
      status: {
        stage: 'COORD_PLAN',
        stageState: 'running',
        progress: { percent: 0, label: 'Starting...' },
        activeAgents: []
      },
      events: [],
      // Legacy or adapter fields if needed by graph channels default?
      // Graph channels handle defaults.
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

                // event matches { nodeName: { ...stateUpdates } }
                const nodeName = Object.keys(event)[0];
                const stateUpdate = event[nodeName];

                // --------------------------------------------------------
                // NEW: Handle Structured Event Log (Phase 20)
                // --------------------------------------------------------
                if (stateUpdate?.events && Array.isArray(stateUpdate.events)) {
                    for (const logEntry of stateUpdate.events) {

                        // Map EventLogEntry to UI DataStream
                        // Types: 'agent_status', 'stage_completed', 'artifact_ready', 'error', 'qc_review', 'patch_applied'

                        // 1. Agent Status / Thoughts
                        if (logEntry.type === 'agent_status') {
                            dataStream.writeData({
                                type: 'progress',
                                label: logEntry.agent, // e.g. 'coordinator', 'researcher'
                                status: 'in-progress',
                                message: logEntry.summary,
                            });
                        }

                        // 2. Stage Completion / Plans
                        if (logEntry.type === 'stage_completed') {
                            dataStream.writeData({
                                type: 'progress',
                                label: 'plan',
                                status: 'completed',
                                message: logEntry.summary,
                                metadata: { stage: logEntry.stage }
                            });
                        }

                        // 3. Artifacts (Tools)
                        if (logEntry.type === 'artifact_ready') {
                             dataStream.writeData({
                                type: 'progress',
                                label: 'tool',
                                status: 'success',
                                message: `Generated Artifact: ${logEntry.summary}`,
                                metadata: { details: logEntry.details }
                            });
                        }

                        // 4. QC Reviews
                        if (logEntry.type === 'qc_review') {
                            dataStream.writeData({
                                type: 'progress',
                                label: 'qc',
                                status: 'in-progress',
                                message: logEntry.summary
                            });
                        }

                        // 5. Code Patches
                        if (logEntry.type === 'patch_applied') {
                             dataStream.writeData({
                                type: 'progress',
                                label: 'code',
                                status: 'success',
                                message: `Code Update: ${logEntry.summary}`,
                                metadata: { details: logEntry.details }
                            });
                        }

                        // 6. Errors
                        if (logEntry.type === 'error') {
                            dataStream.writeData({
                                type: 'progress',
                                label: 'error',
                                status: 'failed',
                                message: logEntry.summary,
                                metadata: { stack: logEntry.details?.stack }
                            });
                        }
                    }
                }

                // --------------------------------------------------------
                // LEGACY FALLBACK (Keep for safety or mixed nodes)
                // --------------------------------------------------------

                // Stream thoughts as progress updates if no events found
                // (Only if we didn't just process events, or maybe we do both?
                //  Let's do both to be safe, but usually events cover it now)

                if (stateUpdate?.thought && !stateUpdate?.events) {
                    dataStream.writeData({
                        type: 'progress',
                        label: nodeName,
                        status: 'in-progress',
                        message: stateUpdate.thought,
                    });
                }

                // Stream plan updates (Legacy)
                if (stateUpdate?.plan && !stateUpdate?.events) {
                     // If PlanState object is present but no event was logged (unlikely with new Coordinator)
                     // leaving this just in case.
                }

                // Stream actual response content to the text stream
                // This is still how the final "message" to the user is delivered
                if (stateUpdate?.response) {
                    dataStream.writeText(stateUpdate.response);
                }

                // Check for generic errors in the state update (not in events)
                if (stateUpdate?.error && !stateUpdate?.events) {
                    const errMsg = typeof stateUpdate.error === 'string' ? stateUpdate.error : stateUpdate.error.message;
                    dataStream.writeData({
                        type: 'progress',
                        label: 'error',
                        status: 'failed',
                        message: `Agent Error: ${errMsg}`,
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
