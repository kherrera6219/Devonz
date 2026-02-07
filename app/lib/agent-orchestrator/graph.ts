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

export type GraphNodeName = 'coordinator' | 'researcher' | 'architect' | 'qc1' | 'qc2' | 'fix' | 'finalize';

export function createGraph() {
  // Build Graph
  const workflow = new StateGraph<RunState>({
    channels: {
      runId: { value: (a: string | undefined, b: string) => b ?? a, default: () => '' },
      conversationId: { value: (a: string | undefined, b: string) => b ?? a, default: () => '' },
      userId: { value: (a: string | undefined, b: string) => b ?? a, default: () => '' },
      createdAt: { value: (a: string | undefined, b: string) => b ?? a, default: () => new Date().toISOString() },
      mode: { value: (a: RunMode | undefined, b: RunMode) => b ?? a, default: () => 'single' as RunMode },
      agentModels: {
        value: (a: any, b: any) => b ?? a,
        default: () => ({
          coordinator: { provider: 'openai', model: 'gpt-5' },
          researcher: { provider: 'google', model: 'gemini-3-flash-preview' },
          architect: { provider: 'anthropic', model: 'claude-sonnet-4-5-20250929' },
        }),
      },
      status: {
        value: (a: RunStatus | undefined, b: Partial<RunStatus>) => ({ ...(a || {}), ...b }) as RunStatus,
        default: () => ({
          stage: 'COORD_PLAN' as StageId,
          stageState: 'running' as const,
          progress: { percent: 0, label: 'Initializing...' },
          activeAgents: [],
        }),
      },
      inputs: {
        value: (a: UserInputs | undefined, b: UserInputs) => b ?? a,
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
        value: (a: PlanState | undefined, b: Partial<PlanState>) => ({ ...(a || {}), ...b }) as PlanState,
        default: () => ({ tasks: [], acceptanceCriteria: [], constraints: [] }) as PlanState,
      },
      research: {
        value: (a: ResearchState | undefined, b: Partial<ResearchState>) => ({ ...(a || {}), ...b }) as ResearchState,
        default: () => ({ lastUpdated: new Date().toISOString() }) as ResearchState,
      },
      artifacts: {
        value: (a: ArtifactState | undefined, b: Partial<ArtifactState>) => ({ ...(a || {}), ...b }) as ArtifactState,
        default: () => ({ currentFiles: {}, patches: [] }) as ArtifactState,
      },
      qc: {
        value: (a: QCState | undefined, b: Partial<QCState>) =>
          ({
            ...(a || {}),
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

      events: {
        value: (a: EventLogEntry[] | undefined, b: EventLogEntry[] | undefined) => (a || []).concat(b || []),
        default: () => [] as EventLogEntry[],
      },

      cost: { value: (a: any, b: any) => b ?? a, default: () => undefined },
      warnings: {
        value: (a: string[] | undefined, b: string[] | undefined) => [...(a || []), ...(b || [])],
        default: () => [] as string[],
      },
      errors: {
        value: (a: string[] | undefined, b: string[] | undefined) => [...(a || []), ...(b || [])],
        default: () => [] as string[],
      },
    },
  })
    .addNode('coordinator', coordinatorNode)
    .addNode('researcher', researchNode)
    .addNode('architect', architectNode)
    .addNode('qc1', qc1Node)
    .addNode('qc2', qc2Node)
    .addNode('fix', fixNode)
    .addNode('finalize', finalizeNode)
    .addEdge(START, 'coordinator')
    .addConditionalEdges('coordinator', checkResearchNeeded, {
      research: 'researcher',
      skipString: 'architect',
    })
    .addEdge('researcher', 'architect')
    .addEdge('architect', 'qc1')
    .addEdge('qc1', 'qc2')
    .addConditionalEdges('qc2', checkQCPass, {
      fix: 'fix',
      finalize: 'finalize',
    })
    .addEdge('fix', 'qc1')
    .addEdge('finalize', END);

  // Checkpointer
  const checkpointer = new MemorySaver();

  return workflow.compile({ checkpointer });
}
