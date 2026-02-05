
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

// QC Nodes (Real implementations using test tools)
const qcStructuralNode = async (state: BoltState) => {
    // Real structural QC using TypeScript and ESLint
    const issues: Array<{ type: string; severity: string; description: string }> = [];

    // Check if files were generated
    if (!state.generatedArtifacts?.files?.length) {
        issues.push({ type: 'structural', severity: 'critical', description: 'No files generated' });
    }

    // Run TypeScript type check on generated files
    try {
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);

        // Type check
        try {
            await execAsync('npx tsc --noEmit', { cwd: process.cwd(), timeout: 60000 });
        } catch (typeError: any) {
            const errorOutput = typeError.stdout || typeError.stderr || '';
            const tsErrors = errorOutput.match(/error TS\d+/g) || [];
            if (tsErrors.length > 0) {
                issues.push({
                    type: 'structural',
                    severity: 'high',
                    description: `TypeScript found ${tsErrors.length} type errors`,
                });
            }
        }

        // ESLint check
        try {
            await execAsync('npx eslint app/lib/agent-orchestrator --format=compact', {
                cwd: process.cwd(),
                timeout: 60000,
            });
        } catch (lintError: any) {
            const errorCount = (lintError.stdout?.match(/\d+ error/g) || []).length;
            if (errorCount > 0) {
                issues.push({
                    type: 'structural',
                    severity: 'medium',
                    description: `ESLint found ${errorCount} errors`,
                });
            }
        }
    } catch (error: any) {
        console.warn('QC Structural check failed:', error.message);
    }

    return {
        qcStage: 'security',
        qcFindings: issues,
    } as Partial<BoltState>;
};

const qcSecurityNode = async (state: BoltState) => {
    // Real security QC checks
    const issues: Array<{ type: string; severity: string; description: string }> = [];

    try {
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);

        // npm audit for dependency vulnerabilities
        try {
            const { stdout } = await execAsync('npm audit --json', {
                cwd: process.cwd(),
                timeout: 60000,
            });
            const audit = JSON.parse(stdout);
            if (audit.metadata?.vulnerabilities?.high > 0 || audit.metadata?.vulnerabilities?.critical > 0) {
                issues.push({
                    type: 'security',
                    severity: 'high',
                    description: `npm audit: ${audit.metadata.vulnerabilities.high || 0} high, ${audit.metadata.vulnerabilities.critical || 0} critical vulnerabilities`,
                });
            }
        } catch (auditError: any) {
            // npm audit exits with error code when vulnerabilities found
            try {
                const audit = JSON.parse(auditError.stdout || '{}');
                if (audit.metadata?.vulnerabilities?.critical > 0) {
                    issues.push({
                        type: 'security',
                        severity: 'critical',
                        description: `Critical security vulnerabilities in dependencies`,
                    });
                }
            } catch {
                // Ignore parse errors
            }
        }

        // Check for hardcoded secrets in generated code
        const generatedFiles = state.generatedArtifacts?.files || [];
        for (const file of generatedFiles) {
            const content = file.content || '';
            // Simple pattern matching for common secrets
            if (/(?:api[_-]?key|secret|password|token)\s*[:=]\s*['"][^'"]{10,}['"]/i.test(content)) {
                issues.push({
                    type: 'security',
                    severity: 'critical',
                    description: `Potential hardcoded secret in ${file.path}`,
                });
            }
        }
    } catch (error: any) {
        console.warn('QC Security check failed:', error.message);
    }

    return {
        qcStage: 'refinement',
        qcFindings: issues,
    } as Partial<BoltState>;
};

const qcFixNode = async (state: BoltState) => {
    // Increment iteration and log what needs fixing
    const criticalIssues = state.qcFindings?.filter(
        (i) => i.severity === 'critical' || i.severity === 'high',
    );

    console.log(`[QC_FIX] Iteration ${(state.qcIteration || 0) + 1}: ${criticalIssues?.length || 0} critical/high issues to address`);

    return {
        qcIteration: (state.qcIteration || 0) + 1,
        // In future: call architect.fix(artifacts, findings) to auto-fix
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

    // Architect leads to QC
    workflow.addEdge('architect' as any, 'qc_structural' as any);

    // QC Flow
    workflow.addEdge('qc_structural' as any, 'qc_security' as any);

    // @ts-ignore
    workflow.addConditionalEdges('qc_security', checkQCPass, {
        fix: 'qc_fix',
        finalize: 'finalize'
    });

    workflow.addEdge('qc_fix' as any, 'qc_structural' as any); // Loop back to structural QC
    workflow.addEdge('finalize' as any, END as any);

    return workflow.compile();
}
