
import { StateGraph, END, START } from '@langchain/langgraph';
import type { BoltState } from './state/types';
import { CoordinatorAgent } from './agents/coordinator';
import { ResearcherAgent } from './agents/researcher';
import { ArchitectAgent } from './agents/architect';

const coordinator = new CoordinatorAgent();
const researcher = new ResearcherAgent();
const architect = new ArchitectAgent();

// Node Wrappers
// Cast return values to any to satisfy StateGraph strict typing or Partial<BoltState>
const planNode = async (state: BoltState) => {
    const res = await coordinator.run(state);
    return res as Partial<BoltState>;
};
const researchTechNode = async (state: BoltState) => {
    const res = await researcher.runTechResearch(state);
    return res as Partial<BoltState>;
};

const researchCompetencyNode = async (state: BoltState) => {
    const res = await researcher.runCompetencyResearch(state);
    return res as Partial<BoltState>;
};

const architectNode = async (state: BoltState) => {
    const res = await architect.run(state);
    return res as Partial<BoltState>;
};

// QC Nodes (Simplified logic for now, utilizing agent capabilities)
const qcStructuralNode = async (state: BoltState) => {
    // Coordinator performs structural QC
    // Check if files exist, basic syntax check (mocked)
    const issues = [];
    if (!state.generatedArtifacts?.files?.length) {
        issues.push({ type: 'structural', severity: 'critical', description: 'No files generated' });
    }
    return {
        qcStage: 'security',
        qcFindings: issues // Logic handles merging in channel
    } as Partial<BoltState>;
};

const qcSecurityNode = async (state: BoltState) => {
    // Researcher checks security
    // Utilizing previous research findings to check against
    return {
        qcStage: 'refinement',
        // In a real impl, we'd call researcher.scan(artifacts)
    } as Partial<BoltState>;
};

const qcFixNode = async (state: BoltState) => {
    // Architect fixes issues
    // For now, if issues exist, we might increment iteration or just pass through
    return {
        qcIteration: (state.qcIteration || 0) + 1,
        // In a real impl, architect.fix(artifacts, findings)
    } as Partial<BoltState>;
};

const finalizeNode = async (state: BoltState) => {
    return {
        status: 'complete',
        response: 'Orchestration complete. All agents have finished their tasks and the solution is ready.'
    } as Partial<BoltState>;
};

// Edge Logic
const shouldResearch = (state: BoltState) => {
    return (state.status === 'researching' ? 'research' : 'architect') as 'research' | 'architect';
};

const checkQCPass = (state: BoltState) => {
    // SEVERITY GATE LOGIC
    // Critical/High: MUST FIX.
    // Medium: FIX unless we are past iteration 2 (relaxed).
    // Low: IGNORE (log only).

    const criticalIssues = state.qcFindings?.filter(i => i.severity === 'high' || i.severity === 'critical');

    // Strict block on Critical/High
    if (criticalIssues?.length && state.qcIteration < (state.maxQcIterations || 3)) {
        return 'fix' as 'fix' | 'finalize';
    }

    return 'finalize' as 'fix' | 'finalize';
};


export function createGraph() {
    const workflow = new StateGraph<BoltState>({
        channels: {
            messages: { value: (a, b) => a.concat(b), default: () => [] },
            agentMessages: { value: (a, b) => a.concat(b), default: () => [] },
            userRequest: { value: (a, b) => b, default: () => '' }, // Last write wins
            conversationId: { value: (a, b) => b, default: () => '' },
            researchQuery: { value: (a, b) => b, default: () => undefined },
            researchFindings: { value: (a, b) => ({...a, ...b}), default: () => undefined }, // Merge findings
            specifications: { value: (a, b) => b, default: () => undefined },
            generatedArtifacts: { value: (a, b) => b, default: () => undefined },
            qcStage: { value: (a, b) => b, default: () => undefined },
            qcFindings: { value: (a, b) => (b ? [...(a||[]), ...b] : a), default: () => [] },
            qcIteration: { value: (a, b) => b, default: () => 0 },
            maxQcIterations: { value: (a, b) => b, default: () => 3 },
            status: { value: (a, b) => b, default: () => 'idle' as const },
            error: { value: (a, b) => b, default: () => undefined },
        }
    });

    // Add Nodes
    // @ts-ignore
    workflow.addNode('coordinator', planNode);
    // @ts-ignore
    workflow.addNode('research_tech', researchTechNode);
    // @ts-ignore
    workflow.addNode('research_competency', researchCompetencyNode);
    // @ts-ignore
    workflow.addNode('architect', architectNode);
    // @ts-ignore
    workflow.addNode('qc_structural', qcStructuralNode);
    // @ts-ignore
    workflow.addNode('qc_security', qcSecurityNode);
    // @ts-ignore
    workflow.addNode('qc_fix', qcFixNode);
    // @ts-ignore
    workflow.addNode('finalize', finalizeNode);

    // Set Entry
    workflow.addEdge(START as any, 'coordinator' as any);

    // Conditional Edges
    // @ts-ignore
    workflow.addConditionalEdges('coordinator', shouldResearch, {
        research: 'research_tech',
        architect: 'architect'
    });

    workflow.addEdge('research_tech' as any, 'research_competency' as any);
    workflow.addEdge('research_competency' as any, 'architect' as any);

    workflow.addEdge('qc_fix' as any, 'qc_structural' as any); // Loop back to structural QC
    workflow.addEdge('finalize' as any, END as any);

    return workflow.compile();
}
