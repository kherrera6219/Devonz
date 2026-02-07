import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import type { RunState, EventLogEntry, PlanState } from '~/lib/agent-orchestrator/types/mas-schemas';
import { safeInvoke } from '~/lib/agent-orchestrator/utils/agent-utils';

/**
 * Coordinator Agent (ChatGPT 5.2)
 *
 * RESPONSIBILITIES:
 * - Analyze User Request
 * - Create Implementation Plan
 * - Generate work packets for Research/Architect
 * - Streaming updates via Event Log
 */
export class CoordinatorAgent {
  private readonly _name = 'coordinator';
  private _model: ChatOpenAI | null = null;
  private readonly _modelName = 'gpt-5.2'; // System default

  private _ensureModel() {
    if (this._model) {
      return;
    }

    const apiKey = process.env.OPENAI_API_KEY;

    this._model = new ChatOpenAI({
      modelName: this._modelName,
      openAIApiKey: apiKey,
      temperature: 0.3, // Lower temperature for structured planning
    });
  }

  /**
   * Main entry point
   */
  async run(state: RunState): Promise<Partial<RunState>> {
    this._ensureModel();

    // Determine action based on stage
    if (state.status.stage === 'COORD_PLAN') {
      return this._handlePlanning(state);
    }

    /*
     * Future: Handle other stages like Finalize or re-planning triggers
     * For now, only Planning is strictly owned by Coordinator in the 7-node flow
     * (Other nodes are owned by Researcher/Architect/QC)
     */

    return {};
  }

  /**
   * STAGE: COORD_PLAN
   * Analyze request -> Create Plan -> Emit Work Packets
   */
  private async _handlePlanning(state: RunState): Promise<Partial<RunState>> {
    const parser = new JsonOutputParser();

    const prompt = PromptTemplate.fromTemplate(
      `You are the Coordinator Agent (ChatGPT 5.2) in a High-Assurance Multi-Agent System.

      User Request: {request}

      Constraints:
      {constraints}

      GOAL: Create a structured implementation plan and decide if research is needed.

      Respond with JSON matching this schema:
      {{
        "intent": "Brief description",
        "needsResearch": boolean,
        "researchQuery": string | null,
        "plan": [
          {{ "id": "task-1", "description": "...", "assignedTo": "architect" | "researcher", "status": "pending" }}
        ],
        "acceptanceCriteria": string[],
        "constraints": string[]
      }}

      {format_instructions}`,
    );

    const chain = prompt.pipe(this._model!).pipe(parser);

    // Execute with retry
    const analysis = (await safeInvoke(
      this._name,
      chain,
      {
        request: state.inputs.requestText || '',
        constraints: JSON.stringify(state.inputs.constraints || {}),
        format_instructions: parser.getFormatInstructions(),
      },
      3,
      {
        intent: 'Error processing request',
        needsResearch: true,
        plan: [{ id: 'error-fallback', description: 'Analyze failure', assignedTo: 'researcher', status: 'pending' }],
        acceptanceCriteria: [],
        constraints: [],
      },
    )) as any;

    // Construct Plan State
    const planState: PlanState = {
      tasks: analysis.plan,
      acceptanceCriteria: analysis.acceptanceCriteria,
      constraints: analysis.constraints || [],
    };

    // Construct Event Log
    const newEvents: EventLogEntry[] = [
      {
        eventId: crypto.randomUUID(),
        runId: state.runId,
        timestamp: new Date().toISOString(),
        type: 'stage_completed',
        stage: 'COORD_PLAN',
        agent: 'coordinator',
        summary: `Plan Created: ${analysis.intent} (${analysis.plan.length} tasks)`,
        visibility: 'user',
      },
    ];

    /*
     * Decide Next Step & Create work packet implicitly by state transition
     * In strict graph, we output state that triggers the next node.
     * The "WorkPacket" concept is logical - here represented by the PlanState
     * and the ResearchQuery if needed.
     */

    // If research needed, output research query to state
    const researchStateUpdate = analysis.needsResearch
      ? {
          lastUpdated: new Date().toISOString(),

          /*
           * We could add a specific query field to ResearchState if schema permits,
           * or key off the plan. For now, let's assume Research Node reads the Plan.
           */
        }
      : {};

    return {
      plan: planState,
      research: {
        ...state.research,
        ...researchStateUpdate,
      },
      events: newEvents,
      status: {
        ...state.status,
        stage: analysis.needsResearch ? 'RESEARCH_TECH_AND_SKILLS' : 'ARCH_BUILD',
      },
    };
  }
}
