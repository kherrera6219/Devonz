import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatOpenAI } from '@langchain/openai';
import type { BoltState, AgentMessage } from '~/lib/agent-orchestrator/state/types';
import { MessageFactory } from '~/lib/agent-orchestrator/utils/message-factory';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { BaseAgent } from '~/lib/agent-orchestrator/agents/base';

export class ResearcherAgent extends BaseAgent {
  protected name = 'researcher';
  private model: any = null;
  private searchModel: any = null;

  constructor() {
    super();
  }

  private ensureModels(state: BoltState) {
    if (this.model && this.searchModel) {
      return;
    }

    const googleApiKey = state.apiKeys?.Google || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!this.model) {
      this.model = new ChatGoogleGenerativeAI({
        model: 'gemini-3-flash-preview',
        maxOutputTokens: 8192,
        temperature: 0.1,
        apiKey: googleApiKey,
      });
    }

    if (!this.searchModel) {
      this.searchModel = new ChatGoogleGenerativeAI({
        model: 'gemini-3-flash-preview',
        temperature: 0.1,
        apiKey: googleApiKey,
      });
    }
  }

  async run(state: BoltState): Promise<Partial<BoltState>> {
    // This method is now secondary as the graph calls specialized methods.
    // However, if called directly, we'll default to tech research.
    try {
        this.ensureModels(state);
        return await this.runTechResearch(state);
    } catch (error: any) {
        return this.createErrorState(state, error);
    }
  }

  async runTechResearch(state: BoltState): Promise<Partial<BoltState>> {
    try {
        this.ensureModels(state);
        const query = state.researchQuery || '';

        const parser = new JsonOutputParser();
        const prompt = PromptTemplate.fromTemplate(
          `Perform a technology reality check for the following query.
          Query: {query}
          Identify latest stable versions, security advisories, and compatibility issues.
          Return JSON: {{ "techStack": {{ "lib": "version" }}, "securityAdvisories": [], "compatibilityIssues": [] }}`
        );

        const chain = prompt.pipe(this.model!).pipe(parser);
        const techRes = await this.safeInvoke(chain, { query });

        return {
            researchFindings: {
                ...state.researchFindings,
                ...techRes as any
            },
            currentAction: { type: 'tool', description: 'Tech stack research complete. Found ' + Object.keys((techRes as any).techStack).length + ' libraries.' }
        };
    } catch (error: any) {
        return this.createErrorState(state, error);
    }
  }

  async runCompetencyResearch(state: BoltState): Promise<Partial<BoltState>> {
    try {
        this.ensureModels(state);
        const query = state.researchQuery || '';

        const parser = new JsonOutputParser();
        const prompt = PromptTemplate.fromTemplate(
          `Create a Project Competency Map for this request.
          Query: {query}
          Identify Skills (concrete standards), Standards (RFCs/OWASP), and Resources (links).
          Return JSON: {{ "domains": [], "skills": [], "standards": [], "resources": [] }}`
        );

        const chain = prompt.pipe(this.model!).pipe(parser);
        const competencyRes = await this.safeInvoke(chain, { query });

        return {
            researchFindings: {
                ...state.researchFindings,
                projectCompetencyMap: competencyRes
            } as any,
            currentAction: { type: 'tool', description: 'Competency mapping complete. Identified ' + (competencyRes as any).skills.length + ' key standards.' }
        };
    } catch (error: any) {
        return this.createErrorState(state, error);
    }
  }
}
