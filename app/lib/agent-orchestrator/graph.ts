
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
  EventLogEntry
} from './types/mas-schemas';

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
  return await coordinator.run(state);
};

const researchNode = async (state: RunState): Promise<Partial<RunState>> => {
  return await researcher.run(state);
};

const architectNode = async (state: RunState): Promise<Partial<RunState>> => {
  return await architect.run(state);
};

const qc1Node = async (state: RunState): Promise<Partial<RunState>> => {
  return await qc.runSyntaxCheck(state);
};

const qc2Node = async (state: RunState): Promise<Partial<RunState>> => {
  return await qc.runCompletenessCheck(state);
};

const fixNode = async (state: RunState): Promise<Partial<RunState>> => {
  // Simple retry strategy: Use Architect to fix
  // We re-use ArchitectAgent but arguably it should be aware of failures.
  // For now, we trust Architect sees 'failed' tasks if we update them?
  // Or we just rely on the loop.
  return await architect.run(state);
};

const finalizeNode = async (state: RunState): Promise<Partial<RunState>> => {
  // Logic: Deliver
  return {
    status: {
      ...state.status,
      stage: 'COORD_POLISH_DELIVER'
    }
  };
};

// ==========================================
// EDGE LOGIC
// ==========================================

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

// ==========================================
// GRAPH CONSTRUCTION
// ==========================================

export function createGraph() {
  const workflow = new StateGraph<RunState>({
    channels: {
      runId: { value: (a, b) => b, default: () => '' },
      conversationId: { value: (a, b) => b, default: () => '' },
      userId: { value: (a, b) => b, default: () => '' },
      createdAt: { value: (a, b) => b, default: () => new Date().toISOString() },
      mode: { value: (a, b) => b, default: () => 'single' as RunMode },
      agentModels: {
        value: (a, b) => b,
        default: () => ({
          coordinator: { provider: 'openai', model: 'gpt-5' },
          researcher: { provider: 'google', model: 'gemini-3-flash-preview' },
          architect: { provider: 'anthropic', model: 'claude-sonnet-4-5-20250929' }
        })
      },
      status: {
        value: (a, b) => ({ ...a, ...b }),
        default: () => ({
          stage: 'COORD_PLAN' as StageId,
          stageState: 'running' as const,
          progress: { percent: 0, label: 'Initializing...' },
          activeAgents: []
        })
      },
      inputs: {
        value: (a, b) => b,
        default: () => ({
          requestText: '',
          conversationId: '',
          constraints: {
            language: 'typescript' as const,
            securityLevel: 'normal' as const,
            testLevel: 'standard' as const
          }
        })
      },

      plan: { value: (a, b) => ({...a, ...b}), default: () => ({ tasks: [], acceptanceCriteria: [], constraints: [] } as PlanState) },
      research: { value: (a, b) => ({...a, ...b}), default: () => ({ lastUpdated: new Date().toISOString() } as ResearchState) },
      artifacts: { value: (a, b) => ({...a, ...b}), default: () => ({ currentFiles: {}, patches: [] } as ArtifactState) },
      qc: { value: (a, b) => ({...a, ...b}), default: () => ({ issues: [], severityCounts: { critical: 0, high: 0, medium: 0, low: 0 }, pass: true, iteration: 0, maxIterations: 3 } as QCState) },

      events: { value: (a, b) => a.concat(b || []), default: () => [] as EventLogEntry[] },

      cost: { value: (a, b) => b, default: () => undefined },
      warnings: { value: (a, b) => b ? [...(a || []), ...b] : a, default: () => [] as string[] },
      errors: { value: (a, b) => b ? [...(a || []), ...b] : a, default: () => [] as string[] },
    }
  }) as any;

  // Add Nodes
  workflow.addNode('coordinator', coordinatorNode as any);
  workflow.addNode('researcher', researchNode as any);
  workflow.addNode('architect', architectNode as any);
  workflow.addNode('qc1', qc1Node as any);
  workflow.addNode('qc2', qc2Node as any);
  workflow.addNode('fix', fixNode as any);
  workflow.addNode('finalize', finalizeNode as any);

  // Set Entry
  workflow.addEdge(START, 'coordinator');

  // Conditional Routing
  // Coordinator -> Research OR Architect
  workflow.addConditionalEdges('coordinator', checkResearchNeeded, {
    research: 'researcher',
    skipString: 'architect' // 'architect' was inferred but let's be explicit if needed
  });
  // Note: LangGraph addConditionalEdges map keys are the return values of the function

  // Simple Edges
  workflow.addEdge('researcher', 'architect');
  workflow.addEdge('architect', 'qc1');
  workflow.addEdge('qc1', 'qc2');

  // QC Logic
  workflow.addConditionalEdges('qc2', checkQCPass, {
    fix: 'fix',
    finalize: 'finalize'
  });

  workflow.addEdge('fix', 'qc1'); // Loop back
  workflow.addEdge('finalize', END);

  // Checkpointer
  const checkpointer = new MemorySaver();

  return workflow.compile({ checkpointer });
}
