import { createGraph } from '~/lib/agent-orchestrator/graph';
import type { RunState } from '~/lib/agent-orchestrator/types/mas-schemas';
import { createScopedLogger } from '~/utils/logger';
import type { CompiledGraph } from '@langchain/langgraph';

const logger = createScopedLogger('OrchestratorService');

export class OrchestratorService {
  private static _instance: OrchestratorService;
  private _graph: CompiledGraph<RunState, Partial<RunState>>;

  private constructor() {
    this._graph = createGraph();
  }

  static getInstance(): OrchestratorService {
    if (!OrchestratorService._instance) {
      OrchestratorService._instance = new OrchestratorService();
    }

    return OrchestratorService._instance;
  }

  async processRequest(
    userRequest: string,
    conversationId: string,
    dataStream: { writeData: (data: any) => void; writeText: (text: string) => void },
    existingMessages: any[],
    apiKeys: Record<string, string>,
    streamRecovery?: { updateActivity: () => void },
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
          testLevel: 'standard',
        },
      },
      status: {
        stage: 'COORD_PLAN',
        stageState: 'running',
        progress: { percent: 0, label: 'Starting...' },
        activeAgents: [],
      },
      events: [],

      /*
       * Legacy or adapter fields if needed by graph channels default?
       * Graph channels handle defaults.
       */
    };

    const config = { configurable: { thread_id: conversationId } };

    try {
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Orchestrator timed out after 5 minutes')), 300000),
      );

      // Create the graph execution promise
      const graphPromise = (async () => {
        const stream = await this._graph.stream(initialState, config);

        for await (const event of stream) {
          // Keep stream alive
          if (streamRecovery) {
            streamRecovery.updateActivity();
          }

          // event matches { nodeName: { ...stateUpdates } }
          const nodeName = Object.keys(event)[0];
          const stateUpdate = event[nodeName];

          /*
           * --------------------------------------------------------
           * NEW: Handle Structured Event Log (Phase 20a - Strict v1)
           * --------------------------------------------------------
           */
          if (stateUpdate?.events && Array.isArray(stateUpdate.events)) {
            for (const logEntry of stateUpdate.events) {
              /*
               * --------------------------------------------------------
               *  V1 STRICT MAPPING LOGIC
               * --------------------------------------------------------
               */

              // A) Run lifecycle & Stage transitions
              if (logEntry.type === 'run_started') {
                dataStream.writeData({ type: 'event_log', payload: logEntry });
              }

              if (logEntry.type === 'stage_started' || logEntry.type === 'stage_completed') {
                dataStream.writeData({ type: 'event_log', payload: logEntry });
              }

              // B) Iteration Tracking (Fix Loop)
              if (logEntry.type === 'iteration_started' || logEntry.type === 'iteration_completed') {
                dataStream.writeData({ type: 'event_log', payload: logEntry });
              }

              // C) Agent Status (Heartbeats & Thoughts)
              if (logEntry.type === 'agent_status') {
                dataStream.writeData({ type: 'event_log', payload: logEntry });
              }

              // E) QC Events (Issues & Pass/Fail)
              if (
                logEntry.type === 'qc_issues_found' ||
                logEntry.type === 'qc_passed' ||
                logEntry.type === 'qc_failed' ||
                logEntry.type === 'qc_review'
              ) {
                dataStream.writeData({ type: 'event_log', payload: logEntry });
              }

              // F) Artifacts & Patches
              if (logEntry.type === 'patch_applied' || logEntry.type === 'artifact_ready') {
                dataStream.writeData({ type: 'event_log', payload: logEntry });
              }

              // Catch-all for warnings/errors
              if (logEntry.type === 'error' || logEntry.type === 'warning') {
                dataStream.writeData({ type: 'event_log', payload: logEntry });
              }
            }
          }

          /*
           * Stream actual response content to the text stream
           * This is still how the final "message" to the user is delivered
           */
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

      await Promise.race([graphPromise, timeoutPromise]);
    } catch (error: any) {
      logger.error('Orchestrator Execution Error:', error);

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
