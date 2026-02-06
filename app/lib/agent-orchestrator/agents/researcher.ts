import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import type {
  RunState,
  TechRealityReport,
  CompetencyMap,
  EventLogEntry
} from '~/lib/agent-orchestrator/types/mas-schemas';
import { safeInvoke, createErrorState } from '~/lib/agent-orchestrator/utils/agent-utils';

/**
 * Researcher Agent (Internal)
 *
 * RESPONSIBILITIES:
 * - Tech Reality Check (Versions, Security, Compatibility)
 * - Competency Mapping (Skills, Standards, Resources)
 * - Output strict JSON artifacts
 */
export class ResearcherAgent {
  private readonly _name = 'researcher';
  private _model: ChatGoogleGenerativeAI | null = null;
  private readonly _modelName = 'gemini-3-flash-preview';

  private _ensureModels(state: RunState) {
    if (this._model) return;

    const googleApiKey = state.status?.activeAgents?.find(a => a.agentId === 'researcher')
      ? process.env.GOOGLE_API_KEY
      : (process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY);

    this._model = new ChatGoogleGenerativeAI({
      model: this._modelName,
      maxOutputTokens: 8192,
      temperature: 0.1, // High precision
      apiKey: googleApiKey,
    });
  }

  /**
   * Main entry point - usually called via specific methods by Graph
   */
  async run(state: RunState): Promise<Partial<RunState>> {
    this._ensureModels(state);
    // Default behavior if called generically: run tech research based on plan
    return await this.runTechResearch(state);
  }

  /**
   * ACTION: TECH_REALITY_CHECK
   */
  async runTechResearch(state: RunState): Promise<Partial<RunState>> {
    try {
      this._ensureModels(state);

      // Context from Plan or User Input
      const query = state.inputs.requestText || 'General Tech Inquiry';
      const constraints = JSON.stringify(state.inputs.constraints || {});

      const parser = new JsonOutputParser();
      const prompt = PromptTemplate.fromTemplate(
        `Perform a rigorous TECHNOLOGY REALITY CHECK.

        Context: {query}
        Constraints: {constraints}

        Your job is to validate the technology stack choices.
        1. Identify latest STABLE versions (no alphas/betas unless requested).
        2. Check for critical security advisories (CVEs).
        3. Flag compatibility issues between chosen libs.

        Respond with JSON matching this schema:
        {{
          "generatedAt": "ISO Date",
          "stackSummary": "Brief overview",
          "recommendedPins": [ {{ "name": "lib", "recommended": "x.y.z", "reason": "..." }} ],
          "compatibilityWarnings": [ {{ "area": "...", "description": "...", "impact": "..." }} ],
          "securityAdvisories": [ {{ "issue": "...", "severity": "low|medium|high|critical", "recommendation": "..." }} ]
        }}

        {format_instructions}`
      );

      const chain = prompt.pipe(this._model!).pipe(parser);
      const report = await safeInvoke(this._name, chain, {
        query,
        constraints,
        format_instructions: parser.getFormatInstructions()
      }) as TechRealityReport;

      // Event Log
      const newEvent: EventLogEntry = {
        eventId: crypto.randomUUID(),
        runId: state.runId,
        timestamp: new Date().toISOString(),
        type: 'artifact_ready',
        stage: 'RESEARCH_TECH_AND_SKILLS',
        agent: 'researcher',
        summary: `Tech Report: ${report.recommendedPins.length} pins, ${report.compatibilityWarnings.length} incompatibility warnings.`,
        visibility: 'expert',
        details: report as any
      };

      return {
        research: {
          ...state.research,
          techReality: report,
          lastUpdated: new Date().toISOString()
        },
        events: [newEvent]
      };

    } catch (error: any) {
      return createErrorState(this._name, state, error);
    }
  }

  /**
   * ACTION: COMPETENCY_MAP
   */
  async runCompetencyResearch(state: RunState): Promise<Partial<RunState>> {
    try {
      this._ensureModels(state);
      const query = state.inputs.requestText || '';

      const parser = new JsonOutputParser();
      const prompt = PromptTemplate.fromTemplate(
        `Create a PROJECT COMPETENCY MAP.

        Context: {query}

        Identify the skills and standards required to build this SAFELY and CORRECTLY.
        Focus on:
        - Concrete skills (e.g. "React Hooks", "Row Level Security")
        - Standards Anchors (RFCs, OWASP, Official Docs)
        - Learning Resources (High quality only)

        Respond with JSON matching this schema:
        {{
          "generatedAt": "ISO Date",
          "skills": [ {{ "name": "...", "importance": "critical|high|medium", "why": "...", "whatWeWillEnforce": ["rule1", "rule2"] }} ],
          "standardsAnchors": [ {{ "name": "...", "whyRelevant": "...", "link": "..." }} ],
          "learningResources": [ {{ "title": "...", "link": "...", "useFor": "..." }} ]
        }}

        {format_instructions}`
      );

      const chain = prompt.pipe(this._model!).pipe(parser);
      const map = await safeInvoke(this._name, chain, {
        query,
        format_instructions: parser.getFormatInstructions()
      }) as CompetencyMap;

      const newEvent: EventLogEntry = {
        eventId: crypto.randomUUID(),
        runId: state.runId,
        timestamp: new Date().toISOString(),
        type: 'artifact_ready',
        stage: 'RESEARCH_TECH_AND_SKILLS',
        agent: 'researcher',
        summary: `Competency Map: ${map.skills.length} skills identified.`,
        visibility: 'expert',
        details: map as any
      };

      return {
        research: {
          ...state.research,
          competencyMap: map,
          lastUpdated: new Date().toISOString()
        },
        events: [newEvent]
      };

    } catch (error: any) {
      return createErrorState(this._name, state, error);
    }
  }
}
