
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import type { BoltState, AgentMessage } from '~/lib/agent-orchestrator/state/types';
import { MessageFactory } from '~/lib/agent-orchestrator/utils/message-factory';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { BaseAgent } from '~/lib/agent-orchestrator/agents/base';

export class ResearcherAgent extends BaseAgent {
  protected name = 'researcher';
  private model: ChatGoogleGenerativeAI;
  private searchModel: ChatGoogleGenerativeAI;

  constructor() {
    super();
    this.model = new ChatGoogleGenerativeAI({
      model: 'gemini-2.0-flash-exp',
      maxOutputTokens: 8192,
      temperature: 0.1,
    });

    // Model configuration for search
    this.searchModel = new ChatGoogleGenerativeAI({
       model: 'gemini-2.0-flash-exp',
       temperature: 0.1,
    });
  }

  async run(state: BoltState): Promise<Partial<BoltState>> {
    try {
        const lastMsg = state.agentMessages[state.agentMessages.length - 1];

        if (lastMsg && lastMsg.to === 'researcher' && lastMsg.type === 'RESEARCH_REQUEST') {
            const query = lastMsg.payload.query;
            return await this.conductResearch(query, state);
        }
    } catch (error: any) {
        return this.createErrorState(state, error);
    }

    return {};
  }

  private async conductResearch(query: string, state: BoltState): Promise<Partial<BoltState>> {
    // 1. Tech Stack & Reality Check
    const techParser = new JsonOutputParser();
    const techPrompt = PromptTemplate.fromTemplate(
      `Perform a technology reality check for the following query.
      Query: {query}

      Identify:
      1. Latest stable versions of relevant libraries.
      2. Known security advisories or CVEs.
      3. Compatibility issues.

      Return JSON:
      {{
         "techStack": {{ "lib": "version" }},
         "securityAdvisories": [],
         "compatibilityIssues": []
      }}`
    );

    // 2. Project Competency Map
    const competencyParser = new JsonOutputParser();
    const competencyPrompt = PromptTemplate.fromTemplate(
      `Create a Project Competency Map for this request.
      Query: {query}

      STRICT OUTPUT CONTROLS:
      1. "Skills": Max 5 items. These must be labels for concrete STANDARDS (e.g., "OAuth 2.0", "PCIDSS"), not generic advice.
      2. "Standards": Specific RFCs, OWASP guides, or vendor docs.
      3. "Certs": Max 3 items, ONLY if they map to the specific tech stack (e.g., "AWS Certified Security" for an AWS project).
      4. "Resources": Max 8 links. Must be authoritative (Official Docs, RFCs).

      Return JSON:
      {{
         "domains": ["Auth", "Frontend", "DB"],
         "skills": [{{ "name": "OAuth 2.0", "impact": "High" }}],
         "standards": [{{ "name": "OWASP Auth Cheat Sheet", "url": "..." }}],
         "resources": [{{ "title": "...", "url": "..." }}]
      }}`
    );

    const techChain = techPrompt.pipe(this.model).pipe(techParser);
    const competencyChain = competencyPrompt.pipe(this.model).pipe(competencyParser);

    const [techRes, competencyRes] = await Promise.all([
        this.safeInvoke(techChain, { query }),
        this.safeInvoke(competencyChain, { query })
    ]);

    const findings = {
        ...techRes as any,
        projectCompetencyMap: competencyRes
    };

    return {
        status: 'architecting', // Pass batton back to coordinator/architect
        researchFindings: findings,
        agentMessages: [
            ...state.agentMessages,
            MessageFactory.result('researcher', 'RESEARCH_COMPLETE', findings)
        ]
    };
  }
}
