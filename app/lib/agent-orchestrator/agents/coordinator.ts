import { ChatOpenAI } from '@langchain/openai';
import type { BoltState } from '~/lib/agent-orchestrator/state/types';
import { MessageFactory } from '~/lib/agent-orchestrator/utils/message-factory';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { safeInvoke, createErrorState } from '~/lib/agent-orchestrator/utils/agent-utils';
import { getToolDescriptions } from '~/lib/agent-orchestrator/tools';

/**
 * Coordinator Agent (ChatGPT 5.2)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * THE PRIMARY HUMAN-FACING AGENT
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This agent is the ONLY agent that communicates directly with the user.
 * Other agents (Researcher/Gemini, Architect/Claude) are internal specialists
 * that report exclusively to this Coordinator.
 *
 * RESPONSIBILITIES:
 * - Receive and clarify user requests
 * - Decompose tasks and delegate to internal agents
 * - Summarize progress (Research → Build → QC → Fix → Final)
 * - Merge outputs from Claude + Gemini into coherent responses
 * - Present QC summaries and final deliverables
 *
 * USER SEES (via Coordinator):
 * - Clarifying questions (only when necessary)
 * - Short plan / acceptance criteria
 * - Progress timeline
 * - QC summary: what was found + fixed
 * - Final deliverables: code bundle + docs + run instructions
 *
 * USER DOES NOT DIRECTLY CHAT WITH:
 * - Architect (Claude) - stays focused on code
 * - Researcher (Gemini) - stays structured, no link overload
 */
export class CoordinatorAgent {
  private readonly name = 'coordinator';
  private model: ChatOpenAI | null = null;

  /**
   * Progress stages for user visibility
   */
  private readonly progressStages = [
    'Understanding Request',
    'Research',
    'Build',
    'QC',
    'Fix',
    'Final',
  ] as const;

  private ensureModel(state: BoltState) {
    if (this.model) {
      return;
    }

    const apiKey = state.apiKeys?.OpenAI || process.env.OPENAI_API_KEY;

    this.model = new ChatOpenAI({
      modelName: 'gpt-5',
      openAIApiKey: apiKey,
      temperature: 0.7, // Conversational but focused
    });
  }

  /**
   * Main entry point - routes to appropriate handler based on state
   */
  async run(state: BoltState): Promise<Partial<BoltState>> {
    try {
      this.ensureModel(state);

      // Route based on current status
      if (state.status === 'idle' || !state.status) {
        return this.handleUserRequest(state);
      }

      if (state.status === 'researching' && state.researchFindings) {
        return this.handleResearchComplete(state);
      }

      if (state.status === 'architecting' && state.generatedArtifacts) {
        return this.handleBuildComplete(state);
      }

      if (state.status === 'qc') {
        return this.handleQCPhase(state);
      }

      if (state.status === 'complete') {
        return this.prepareFinalDeliverable(state);
      }
    } catch (error: any) {
      return createErrorState(this.name, state, error);
    }

    return {};
  }

  /**
   * STAGE 1: Understanding Request
   * Analyze intent, ask clarifying questions if needed, create plan
   */
  private async handleUserRequest(state: BoltState): Promise<Partial<BoltState>> {
    const parser = new JsonOutputParser();
    const toolDocs = getToolDescriptions('coordinator');

    const replanContext =
      state.needsReplan && state.replanSuggestion
        ? `\n\n## RE-PLANNING REQUIRED\nPrevious plan needs revision. Reflection feedback:\n${state.replanSuggestion}\n`
        : '';

    const prompt = PromptTemplate.fromTemplate(
      `You are the Coordinator Agent (ChatGPT 5.2), the primary interface between the user and our multi-agent system.

      Your role:
      - Understand what the user wants
      - Create a clear, concise plan
      - Decide if research is needed before building

      User Request: {request}
      ${replanContext}

      ## Available Capabilities
      {tools}

      Analyze the request and respond with JSON:
      {{
        "intent": "Brief description of what user wants",
        "needsClarification": false,
        "clarifyingQuestion": null,
        "needsResearch": true/false,
        "researchQuery": "What to research (if needed)",
        "plan": ["Step 1", "Step 2", ...],
        "acceptanceCriteria": ["Criterion 1", "Criterion 2", ...]
      }}

      RULES:
      - Only ask clarifying questions for truly ambiguous requests
      - Keep plans concise (3-5 steps max)
      - Set needsResearch=true for complex tech, APIs, or version-sensitive work

      {format_instructions}`,
    );

    const chain = prompt.pipe(this.model!).pipe(parser);

    const analysis = (await safeInvoke(
      this.name,
      chain,
      {
        request: state.userRequest,
        tools: toolDocs,
        format_instructions: parser.getFormatInstructions(),
      },
      3,
      {
        intent: 'General Inquiry',
        needsClarification: false,
        needsResearch: false,
        plan: ['Respond to user'],
        acceptanceCriteria: [],
      },
    )) as {
      intent: string;
      needsClarification: boolean;
      clarifyingQuestion?: string;
      needsResearch: boolean;
      researchQuery?: string;
      plan: string[];
      acceptanceCriteria: string[];
    };

    // If clarification needed, pause and ask user
    if (analysis.needsClarification && analysis.clarifyingQuestion) {
      return {
        status: 'awaiting_clarification',
        response: analysis.clarifyingQuestion,
        thought: 'Need clarification from user before proceeding.',
      };
    }

    // Build user-facing progress message
    const planSummary = this.formatPlanForUser(analysis.plan, analysis.acceptanceCriteria);

    const newState: Partial<BoltState> = {
      status: analysis.needsResearch ? 'researching' : 'architecting',
      researchQuery: analysis.researchQuery,
      plan: analysis.plan,
      acceptanceCriteria: analysis.acceptanceCriteria,
      progressStage: analysis.needsResearch ? 'Research' : 'Build',
      thought: `Intent: "${analysis.intent}"`,
      response: planSummary, // User-facing output
      currentAction: {
        type: 'plan',
        description: `Identified ${analysis.plan.length} tasks`,
      },
      needsReplan: false,
      replanSuggestion: undefined,
      iterationCount: (state.iterationCount || 0) + 1,
      agentMessages: [
        ...state.agentMessages,
        MessageFactory.create('coordinator', 'coordinator', 'INTENT_ANALYSIS', analysis),
      ],
    };

    if (analysis.needsResearch && analysis.researchQuery) {
      newState.agentMessages?.push(
        MessageFactory.researchRequest(analysis.researchQuery, {}, state.conversationId),
      );
    }

    return newState;
  }

  /**
   * STAGE 2: Research Complete
   * Merge Researcher (Gemini) findings and pass to Architect
   */
  private async handleResearchComplete(state: BoltState): Promise<Partial<BoltState>> {
    const parser = new JsonOutputParser();

    const prompt = PromptTemplate.fromTemplate(
      `You are the Coordinator. The Researcher (Gemini) has completed their analysis.

      Original Request: {request}

      Research Findings:
      {research}

      Create specifications for the Architect (Claude) to build.
      Keep the specs focused and actionable.

      Return JSON:
      {{
        "architectSpecs": {{
          "overview": "Brief description",
          "components": ["Component 1", ...],
          "technicalDecisions": {{}}
        }},
        "userUpdate": "Brief progress update for user"
      }}`,
    );

    const chain = prompt.pipe(this.model!).pipe(parser);

    const result = (await safeInvoke(this.name, chain, {
      request: state.userRequest,
      research: JSON.stringify(state.researchFindings, null, 2),
    })) as {
      architectSpecs: object;
      userUpdate: string;
    };

    return {
      status: 'architecting',
      progressStage: 'Build',
      specifications: result.architectSpecs,
      response: `✓ Research complete. ${result.userUpdate}`,
      thought: 'Research synthesized. Dispatching to Architect (Claude).',
      currentAction: {
        type: 'delegate',
        description: 'Sending specs to Architect...',
      },
      agentMessages: [
        ...state.agentMessages,
        MessageFactory.create('coordinator', 'architect', 'ARCHITECT_SPECS', result.architectSpecs),
      ],
    };
  }

  /**
   * STAGE 3: Build Complete
   * Transition to QC phase
   */
  private async handleBuildComplete(state: BoltState): Promise<Partial<BoltState>> {
    const fileCount = state.generatedArtifacts?.files?.length || 0;

    return {
      status: 'qc',
      progressStage: 'QC',
      qcStage: 'structural',
      qcFindings: [],
      qcIteration: 0,
      response: `✓ Build complete. Generated ${fileCount} files. Running quality checks...`,
      thought: 'Architect complete. Starting QC pipeline.',
    };
  }

  /**
   * STAGE 4: QC Phase
   * Evaluate QC findings and decide: Fix, Retry, or Complete
   */
  private async handleQCPhase(state: BoltState): Promise<Partial<BoltState>> {
    const findings = state.qcFindings || [];
    const criticalCount = findings.filter((f: any) => f.severity === 'critical').length;
    const highCount = findings.filter((f: any) => f.severity === 'high').length;

    // If critical/high issues, go to Fix stage
    if (criticalCount > 0 || highCount > 0) {
      return {
        status: 'fixing',
        progressStage: 'Fix',
        response: this.formatQCSummaryForUser(findings),
        thought: `QC found ${criticalCount} critical, ${highCount} high issues. Fixing...`,
      };
    }

    // All clear - proceed to final
    return {
      status: 'complete',
      progressStage: 'Final',
      response: '✓ Quality checks passed. Preparing final deliverable...',
      thought: 'QC complete with no blocking issues.',
    };
  }

  /**
   * STAGE 5: Final Deliverable
   * Package and present everything to user
   */
  private async prepareFinalDeliverable(state: BoltState): Promise<Partial<BoltState>> {
    const artifacts = state.generatedArtifacts;

    const deliverable = this.formatFinalDeliverable(state);

    return {
      status: 'delivered',
      progressStage: 'Final',
      response: deliverable,
      thought: 'Final deliverable packaged for user.',
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // USER-FACING FORMATTERS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Format plan for user display (concise, not internal details)
   */
  private formatPlanForUser(plan: string[], criteria: string[]): string {
    let output = '## Plan\n';
    plan.forEach((step, i) => {
      output += `${i + 1}. ${step}\n`;
    });

    if (criteria.length > 0) {
      output += '\n## Acceptance Criteria\n';
      criteria.forEach((c) => {
        output += `- ${c}\n`;
      });
    }

    output += `\n_Progress: Understanding Request → Research → Build → QC → Final_`;

    return output;
  }

  /**
   * Format QC summary for user (what was found, what was fixed)
   */
  private formatQCSummaryForUser(findings: any[]): string {
    const critical = findings.filter((f) => f.severity === 'critical');
    const high = findings.filter((f) => f.severity === 'high');

    let summary = '## Quality Check Results\n\n';

    if (critical.length > 0) {
      summary += `⚠️ **${critical.length} Critical Issues** (fixing now)\n`;
      critical.slice(0, 3).forEach((f) => {
        summary += `- ${f.message}\n`;
      });
    }

    if (high.length > 0) {
      summary += `\n🔶 **${high.length} High Priority Issues** (fixing now)\n`;
      high.slice(0, 3).forEach((f) => {
        summary += `- ${f.message}\n`;
      });
    }

    return summary;
  }

  /**
   * Format final deliverable for user
   */
  private formatFinalDeliverable(state: BoltState): string {
    const files = state.generatedArtifacts?.files || [];

    let output = '## ✅ Complete!\n\n';
    output += `### Files Generated (${files.length})\n`;

    files.slice(0, 10).forEach((f: any) => {
      output += `- \`${f.path}\`\n`;
    });

    if (files.length > 10) {
      output += `- _...and ${files.length - 10} more_\n`;
    }

    // Include run instructions if present
    const docs = state.generatedArtifacts?.docs;

    if (docs && docs.length > 0) {
      output += '\n### Documentation\n';
      docs.forEach((doc: any) => {
        output += `- ${doc.title || doc.path}\n`;
      });
    }

    return output;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPERT MODE: Internal logs for advanced users
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get detailed agent logs for expert mode display
   * (Only shown when user toggles "Expose agent logs")
   */
  getExpertModeLogs(state: BoltState): object {
    return {
      researcherReport: state.researchFindings || null,
      architectNotes: state.specifications || null,
      qcIssues: state.qcFindings || [],
      agentMessages: state.agentMessages.map((m) => ({
        from: m.from,
        to: m.to,
        type: m.type,
        timestamp: m.timestamp,
      })),
    };
  }
}
