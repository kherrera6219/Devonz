import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import type {
  RunState,
  TechRealityReport,
  CompetencyMap,
  EventLogEntry,
} from '~/lib/agent-orchestrator/types/mas-schemas';
import { safeInvoke, createErrorState } from '~/lib/agent-orchestrator/utils/agent-utils';
import { RAGService } from '~/lib/services/ragService';
import { graphService } from '~/lib/services/graphService';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('researcher-agent');

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
    if (this._model) {
      return;
    }

    const googleApiKey = state.status?.activeAgents?.find((a) => a.agentId === 'researcher')
      ? process.env.GOOGLE_API_KEY
      : process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

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
  /**
   * Main entry point for the Researcher Agent.
   * Performs technology research, competency mapping, and codebase analysis.
   *
   * @param state The current run state of the MAS orchestrator.
   * @returns A partial state containing research artifacts and event logs.
   */
  async run(state: RunState): Promise<Partial<RunState>> {
    this._ensureModels(state);

    const infraContext = await this._getInfrastructureContext(state);

    // If the stage is specifically analysis, run that
    if (state.status.stage === 'RESEARCH_TECH_AND_SKILLS') {
      const techUpdate = await this.runTechResearch(state, infraContext);
      const competencyUpdate = await this.runCompetencyResearch(state);
      const codebaseUpdate = await this.runCodebaseAnalysis(state, infraContext);

      return {
        research: {
          ...state.research,
          ...techUpdate.research,
          ...competencyUpdate.research,
          ...codebaseUpdate.research,
        },
        events: [...(techUpdate.events || []), ...(competencyUpdate.events || []), ...(codebaseUpdate.events || [])],
      };
    }

    return await this.runTechResearch(state, infraContext);
  }

  /**
   * Helper to fetch context from RAG and Graph infrastructure
   */
  private async _getInfrastructureContext(state: RunState): Promise<string> {
    const projectId = state.conversationId;
    const query = state.inputs.requestText || '';

    const contextParts: string[] = [];

    try {
      // 1. Query RAG for semantic context
      const ragResults = await RAGService.getInstance().query(projectId, query, 5);

      if (ragResults.length > 0) {
        contextParts.push('### Codebase Semantic Context (RAG):\n' + ragResults.join('\n\n'));
      }

      // 2. Query Graph for dependency context
      const graphResults = await graphService.getProjectSubgraph(projectId, 10);

      if (graphResults.length > 0) {
        const graphSummary = graphResults
          .map((r) => `- ${r.source.path} --(${r.relationship})--> ${r.target.path}`)
          .join('\n');
        contextParts.push('### Dependency Graph Context:\n' + graphSummary);
      }
    } catch (err) {
      logger.error('Failed to fetch infrastructure context', err);
    }

    return contextParts.join('\n\n');
  }

  /**
   * ACTION: CODEBASE_ANALYSIS
   * Performs deep recursive analysis of the codebase.
   */
  /**
   * ACTION: CODEBASE_ANALYSIS
   * Performs deep recursive analysis of the codebase using RAG and Graph services.
   *
   * @param state The current run state.
   * @param providedContext Optional infrastructure context to avoid redundant fetching.
   * @returns Partial state with findings.
   */
  async runCodebaseAnalysis(state: RunState, providedContext?: string): Promise<Partial<RunState>> {
    try {
      this._ensureModels(state);

      const infraContext = providedContext ?? (await this._getInfrastructureContext(state));

      const parser = new JsonOutputParser();
      const prompt = PromptTemplate.fromTemplate(
        `Analyze the following CODEBASE CONTEXT and identify potential architectural bottlenecks and patterns.

        Infrastructure Context:
        {infraContext}

        Identify:
        1. Circular dependencies or complex couplings.
        2. Incomplete or "stub" implementations.
        3. Alignment with 2025 development standards.

        Respond with JSON:
        {{
          "architecturalNotes": "String",
          "bottlenecks": ["String"],
          "suggestedPatterns": ["String"]
        }}

        {format_instructions}`,
      );

      const chain = prompt.pipe(this._model!).pipe(parser);
      const analysis = await safeInvoke(this._name, chain, {
        infraContext,
        format_instructions: parser.getFormatInstructions(),
      });

      const newEvent: EventLogEntry = {
        eventId: crypto.randomUUID(),
        runId: state.runId,
        timestamp: new Date().toISOString(),
        type: 'artifact_ready',
        stage: 'RESEARCH_TECH_AND_SKILLS',
        agent: 'researcher',
        summary: 'Deep Codebase Analysis complete.',
        visibility: 'expert',
        details: analysis as any,
      };

      return {
        research: {
          ...state.research,
          codebaseAnalysis: analysis,
          lastUpdated: new Date().toISOString(),
        },
        events: [newEvent],
      };
    } catch (error) {
      return createErrorState(this._name, state, error);
    }
  }

  /**
   * ACTION: TECH_REALITY_CHECK
   */
  /**
   * ACTION: TECH_REALITY_CHECK
   * Validates the technology stack against latest standards, CVEs, and compatibility.
   */
  async runTechResearch(state: RunState, providedContext?: string): Promise<Partial<RunState>> {
    try {
      this._ensureModels(state);

      // Context from Plan or User Input
      const query = state.inputs.requestText || 'General Tech Inquiry';
      const constraints = JSON.stringify(state.inputs.constraints || {});
      const infraContext = providedContext ?? (await this._getInfrastructureContext(state));

      const parser = new JsonOutputParser();
      const prompt = PromptTemplate.fromTemplate(
        `Perform a rigorous TECHNOLOGY REALITY CHECK.

        Context: {query}
        Infrastructure Context: {infraContext}
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

        {format_instructions}`,
      );

      const chain = prompt.pipe(this._model!).pipe(parser);
      const report = (await safeInvoke(this._name, chain, {
        query,
        infraContext,
        constraints,
        format_instructions: parser.getFormatInstructions(),
      })) as TechRealityReport;

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
        details: report as any,
      };

      return {
        research: {
          ...state.research,
          techReality: report,
          lastUpdated: new Date().toISOString(),
        },
        events: [newEvent],
      };
    } catch (error) {
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

        {format_instructions}`,
      );

      const chain = prompt.pipe(this._model!).pipe(parser);
      const map = (await safeInvoke(this._name, chain, {
        query,
        format_instructions: parser.getFormatInstructions(),
      })) as CompetencyMap;

      const newEvent: EventLogEntry = {
        eventId: crypto.randomUUID(),
        runId: state.runId,
        timestamp: new Date().toISOString(),
        type: 'artifact_ready',
        stage: 'RESEARCH_TECH_AND_SKILLS',
        agent: 'researcher',
        summary: `Competency Map: ${map.skills.length} skills identified.`,
        visibility: 'expert',
        details: map as any,
      };

      return {
        research: {
          ...state.research,
          competencyMap: map,
          lastUpdated: new Date().toISOString(),
        },
        events: [newEvent],
      };
    } catch (error) {
      return createErrorState(this._name, state, error as Error);
    }
  }
}
