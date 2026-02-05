
import { ChatOpenAI } from '@langchain/openai';
import type { BoltState, AgentMessage } from '~/lib/agent-orchestrator/state/types';
import { MessageFactory } from '~/lib/agent-orchestrator/utils/message-factory';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { BaseAgent } from '~/lib/agent-orchestrator/agents/base';

export class CoordinatorAgent extends BaseAgent {
  protected name = 'coordinator';
  private model: ChatOpenAI;

  constructor() {
    super();
    this.model = new ChatOpenAI({
      modelName: 'gpt-5.2',
      temperature: 0.3,
    });
  }

  async run(state: BoltState): Promise<Partial<BoltState>> {
    try {
        // If just starting, analyze intent
        if (state.status === 'idle' || !state.status) {
        return this.analyzeIntent(state);
        }

        // If research just finished, plan architecture
        if (state.status === 'researching' && state.researchFindings) {
        return this.planArchitecture(state);
        }

        // If architecture is done, start QC
        if (state.status === 'architecting' && state.generatedArtifacts) {
        return this.startQC(state);
        }

        // If QC is checking, evaluate
        if (state.status === 'qc') {
            return this.evaluateQC(state);
        }
    } catch (error: any) {
        return this.createErrorState(state, error);
    }

    return {};
  }

  private async analyzeIntent(state: BoltState): Promise<Partial<BoltState>> {
    const parser = new JsonOutputParser();
    const prompt = PromptTemplate.fromTemplate(
      `You are the Coordinator Agent. Analyze this request and decompose it.

      User Request: {request}

      Return JSON with:
      - intent: string
      - needsResearch: boolean
      - researchQuery: string (if needed)
      - tasks: string[]

      DEFINITION OF DONE:
      - Research: Version pins + Competency Map.
      - Architect: Compilable code + Security Checks.
      - QC: No Critical/High issues.

      {format_instructions}`
    );

    const chain = prompt.pipe(this.model).pipe(parser);

    // Explicitly define the shape of the parsed output
    const analysis = await this.safeInvoke(chain, {
      request: state.userRequest,
      format_instructions: parser.getFormatInstructions(),
    }, 3, {
        // Fallback if analysis fails repeatedly
        intent: 'General Inquiry',
        needsResearch: false,
        tasks: ['Respond to user']
    }) as {
      intent: string;
      needsResearch: boolean;
      researchQuery?: string;
      tasks: string[];
    };

    const newState: Partial<BoltState> = {
      status: analysis.needsResearch ? 'researching' : 'architecting',
      researchQuery: analysis.researchQuery,
      agentMessages: [
        ...state.agentMessages,
        MessageFactory.create('coordinator', 'coordinator', 'INTENT_ANALYSIS', analysis)
      ]
    };

    // Dispatch research request if needed
    if (analysis.needsResearch && analysis.researchQuery) {
        newState.agentMessages?.push(
            MessageFactory.researchRequest(analysis.researchQuery, {}, state.conversationId)
        );
    }

    return newState;
  }

  private async planArchitecture(state: BoltState): Promise<Partial<BoltState>> {
    // Merge research findings into specs
    const parser = new JsonOutputParser();
    const prompt = PromptTemplate.fromTemplate(
      `Create architectural specifications based on research.

      Request: {request}
      Research: {research}

      Return JSON specs for the Architect.`
    );

    const chain = prompt.pipe(this.model).pipe(parser);
    const specs = await this.safeInvoke(chain, {
        request: state.userRequest,
        research: JSON.stringify(state.researchFindings)
    });

    return {
        status: 'architecting',
        specifications: specs,
        agentMessages: [
            ...state.agentMessages,
            MessageFactory.create('coordinator', 'architect', 'ARCHITECT_SPECS', specs)
        ]
    };
  }

  private async startQC(state: BoltState): Promise<Partial<BoltState>> {
      return {
          status: 'qc',
          qcStage: 'structural',
          qcFindings: [],
          qcIteration: 0
      };
  }

  private async evaluateQC(state: BoltState): Promise<Partial<BoltState>> {
     // Logic to check findings and decide next step (Retry, Polishing, Escalate)
     // Placeholder for now
     return {};
  }
}
