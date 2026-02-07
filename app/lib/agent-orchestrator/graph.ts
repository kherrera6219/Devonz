import { StateGraph, END, START } from '@langchain/langgraph';
import { MemorySaver } from '@langchain/langgraph-checkpoint';
import type {
  RunState,
  RunMode,
  StageId,
  PlanState,
  ResearchState,
  ArtifactState,
  QCState,
  EventLogEntry,
  RunStatus,
  UserInputs,
} from './types/mas-schemas';
import { safeNodeExecution } from './utils/error-handling';

// Placeholder or adapter imports for agents (Phase 19 will fully implement these)
import { CoordinatorAgent } from './agents/coordinator';
import { ResearcherAgent } from './agents/researcher';
import { ArchitectAgent } from './agents/architect';
import { QCAgent } from './agents/qc';

/*
 * NODE IMPLEMENTATIONS
 * These nodes ensure strict adherence to the RunState schema.
 * Actual intelligence logic will be connected in Phase 19.
 */

const coordinator = new CoordinatorAgent();
const researcher = new ResearcherAgent();
const architect = new ArchitectAgent();
const qc = new QCAgent();

const coordinatorNode = async (state: RunState): Promise<Partial<RunState>> => {
  return await safeNodeExecution('coordinator', () => coordinator.run(state), {
    status: { ...state.status, stageState: 'failed' },
  });
};

const researchNode = async (state: RunState): Promise<Partial<RunState>> => {
  return await safeNodeExecution('researcher', () => researcher.run(state), {
    status: { ...state.status, stageState: 'failed' },
  });
};

const architectNode = async (state: RunState): Promise<Partial<RunState>> => {
  return await safeNodeExecution('architect', () => architect.run(state), {
    status: { ...state.status, stageState: 'failed' },
  });
};

const qc1Node = async (state: RunState): Promise<Partial<RunState>> => {
  return await safeNodeExecution('qc1_syntax', () => qc.runSyntaxCheck(state), {
    status: { ...state.status, stageState: 'failed' },
  });
};

const qc2Node = async (state: RunState): Promise<Partial<RunState>> => {
  return await safeNodeExecution('qc2_completeness', () => qc.runCompletenessCheck(state), {
    status: { ...state.status, stageState: 'failed' },
  });
};

const fixNode = async (state: RunState): Promise<Partial<RunState>> => {
  return await safeNodeExecution('architect_fix', () => architect.run(state), {
    status: { ...state.status, stageState: 'failed' },
  });
};

const finalizeNode = async (state: RunState): Promise<Partial<RunState>> => {
  // Logic: Deliver
  return {
    status: {
      ...state.status,
      stage: 'COORD_POLISH_DELIVER',
    },
  };
};

/*
 * ==========================================
 * EDGE LOGIC
 * ==========================================
 */

const checkResearchNeeded = (state: RunState) => {
  // Check if Coordinator set the stage to Research
  if (state.status.stage === 'RESEARCH_TECH_AND_SKILLS') {
    return 'research';
  }

  // Otherwise, skip to Architect
  return 'skipString';
};

const checkQCPass = (state: RunState) => {
  // Check severity counts
  const { critical, high } = state.qc?.severityCounts || { critical: 0, high: 0 };
  const currentIteration = state.qc?.iteration || 0;
  const maxIterations = state.qc?.maxIterations || 3;

  if ((critical > 0 || high > 0) && currentIteration < maxIterations) {
    return 'fix';
  }

  return 'finalize';
};

/*
 * ==========================================
 * GRAPH CONSTRUCTION
 * ==========================================
 */

export function createGraph() {
  const workflow = new StateGraph<RunState>({
    channels: {
      runId: { value: (_: string, b: string) => b, default: () => '' },
      conversationId: { value: (_: string, b: string) => b, default: () => '' },
      userId: { value: (_: string, b: string) => b, default: () => '' },
      createdAt: { value: (_: string, b: string) => b, default: () => new Date().toISOString() },
      mode: { value: (_: string, b: RunMode) => b, default: () => 'single' as RunMode },
      agentModels: {
        value: (_: any, b: any) => b,
        default: () => ({
          coordinator: { provider: 'openai', model: 'gpt-5' },
          researcher: { provider: 'google', model: 'gemini-3-flash-preview' },
          architect: { provider: 'anthropic', model: 'claude-sonnet-4-5-20250929' },
        }),
      },
      status: {
        value: (a: RunStatus, b: Partial<RunStatus>) => ({ ...a, ...b }),
        default: () => ({
          stage: 'COORD_PLAN' as StageId,
          stageState: 'running' as const,
          progress: { percent: 0, label: 'Initializing...' },
          activeAgents: [],
        }),
      },
      inputs: {
        value: (_: UserInputs, b: UserInputs) => b,
        default: () => ({
          requestText: '',
          conversationId: '',
          constraints: {
            language: 'typescript' as const,
            securityLevel: 'normal' as const,
            testLevel: 'standard' as const,
          },
        }),
      },

      plan: {
        value: (a: PlanState, b: Partial<PlanState>) => ({ ...a, ...b }),
        default: () => ({ tasks: [], acceptanceCriteria: [], constraints: [] }) as PlanState,
      },
      research: {
        value: (a: ResearchState, b: Partial<ResearchState>) => ({ ...a, ...b }),
        default: () => ({ lastUpdated: new Date().toISOString() }) as ResearchState,
      },
      artifacts: {
        value: (a: ArtifactState, b: Partial<ArtifactState>) => ({ ...a, ...b }),
        default: () => ({ currentFiles: {}, patches: [] }) as ArtifactState,
      },
      qc: {
        value: (a: QCState, b: Partial<QCState>) =>
          ({
            ...a,
            ...b,
          }) as QCState,
        default: () =>
          ({
            issues: [],
            severityCounts: { critical: 0, high: 0, medium: 0, low: 0 },
            pass: true,
            iteration: 0,
            maxIterations: 3,
          }) as QCState,
      },

      events: { value: (a: EventLogEntry[], b: EventLogEntry[]) => a.concat(b || []), default: () => [] as EventLogEntry[] },

      cost: { value: (_: any, b: any) => b, default: () => undefined },
      warnings: { value: (a: string[], b: string[]) => (b ? [...(a || []), ...b] : a), default: () => [] as string[] },
      errors: { value: (a: string[], b: string[]) => (b ? [...(a || []), ...b] : a), default: () => [] as string[] },
    },
  });

  // Add Nodes
  workflow.addNode('coordinator', coordinatorNode);
  workflow.addNode('researcher', researchNode);
  workflow.addNode('architect', architectNode);
  workflow.addNode('qc1', qc1Node);
  workflow.addNode('qc2', qc2Node);
  workflow.addNode('fix', fixNode);
  workflow.addNode('finalize', finalizeNode);

  // Set Entry
  workflow.addEdge(START, 'coordinator');

  /*
   * Conditional Routing
   * Coordinator -> Research OR Architect
   */
  workflow.addConditionalEdges('coordinator', checkResearchNeeded, {
    research: 'researcher',
    skipString: 'architect', // 'architect' was inferred but let's be explicit if needed
  });

  // Note: LangGraph addConditionalEdges map keys are the return values of the function

  // Simple Edges
  workflow.addEdge('researcher', 'architect');
  workflow.addEdge('architect', 'qc1');
  workflow.addEdge('qc1', 'qc2');

  // QC Logic
  workflow.addConditionalEdges('qc2', checkQCPass, {
    fix: 'fix',
    finalize: 'finalize',
  });

  workflow.addEdge('fix', 'qc1'); // Loop back
  workflow.addEdge('finalize', END);

  // Checkpointer
  const checkpointer = new MemorySaver();

  return workflow.compile({ checkpointer });
}
