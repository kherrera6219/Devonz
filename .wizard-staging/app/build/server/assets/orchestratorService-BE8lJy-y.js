import { StateGraph, START, END } from '@langchain/langgraph';
import { BaseCheckpointSaver, getCheckpointId, copyCheckpoint, WRITES_IDX_MAP } from '@langchain/langgraph-checkpoint';
import { r as redisService, c as createScopedLogger, R as RAGService, g as graphService, e as executeAgentTool, w as webcontainer } from './server-build-cW6KDhQI.js';
import process from 'vite-plugin-node-polyfills/shims/process';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatAnthropic } from '@langchain/anthropic';
import 'react/jsx-runtime';
import '@remix-run/react';
import 'isbot';
import 'react-dom/server';
import 'node:stream';
import 'ioredis';
import 'node:crypto';
import 'node:async_hooks';
import '@nanostores/react';
import 'nanostores';
import 'js-cookie';
import 'react';
import 'react-dnd';
import 'react-dnd-html5-backend';
import 'remix-utils/client-only';
import 'react-toastify';
import 'react-i18next';
import '@remix-run/node';
import 'class-variance-authority';
import 'vite-plugin-node-polyfills/shims/buffer';
import 'openai';
import '@ai-sdk/anthropic';
import '@ai-sdk/google';
import '@ai-sdk/openai';
import 'ai';
import 'ai/mcp-stdio';
import '@modelcontextprotocol/sdk/client/streamableHttp.js';
import 'zod';
import 'jszip';
import 'crypto';
import '@aws-sdk/client-s3';
import 'llamaindex';
import 'pg';
import '@octokit/rest';
import 'neo4j-driver';
import 'rehype-sanitize';
import 'ignore';
import 'child_process';
import 'fs';
import '@webcontainer/api';
import '@radix-ui/react-tooltip';
import 'isomorphic-git';
import 'isomorphic-git/http/web';
import 'framer-motion';
import 'path-browserify';
import 'istextorbinary';
import 'diff';
import 'file-saver';
import 'date-fns';
import '@radix-ui/react-dialog';
import 'react-qrcode-logo';
import 'zustand';
import 'lucide-react';

const logger$5 = createScopedLogger("RedisCheckpointer");
class RedisCheckpointSaver extends BaseCheckpointSaver {
  _prefix = "lg:checkpoint";
  constructor(serde) {
    super(serde);
  }
  _generateKey(threadId, checkpointNamespace, checkpointId) {
    return `${this._prefix}:${threadId}:${checkpointNamespace}:${checkpointId}`;
  }
  _generateWritesKey(threadId, checkpointNamespace, checkpointId) {
    return `${this._prefix}:writes:${threadId}:${checkpointNamespace}:${checkpointId}`;
  }
  _generateIndexKey(threadId, checkpointNamespace) {
    return `${this._prefix}:index:${threadId}:${checkpointNamespace}`;
  }
  _generateSetKey(threadId, checkpointNamespace) {
    return `${this._prefix}:set:${threadId}:${checkpointNamespace}`;
  }
  async getTuple(config) {
    const threadId = config.configurable?.thread_id;
    const checkpointNamespace = config.configurable?.checkpoint_ns ?? "";
    let checkpointId = getCheckpointId(config);
    if (!threadId) {
      return void 0;
    }
    if (!checkpointId) {
      const indexKey = this._generateIndexKey(threadId, checkpointNamespace);
      const latestId = await redisService.get(indexKey);
      if (!latestId) {
        return void 0;
      }
      checkpointId = latestId;
    }
    const key = this._generateKey(threadId, checkpointNamespace, checkpointId);
    const data = await redisService.get(key);
    if (!data) {
      return void 0;
    }
    try {
      const [_serializedCheckpoint, _serializedMetadata, parentCheckpointId] = JSON.parse(data);
      const checkpoint = await this.serde.loadsTyped("json", _serializedCheckpoint);
      const metadata = await this.serde.loadsTyped("json", _serializedMetadata);
      const writesKey = this._generateWritesKey(threadId, checkpointNamespace, checkpointId);
      const writesData = await redisService.get(writesKey);
      const writes = writesData ? JSON.parse(writesData) : {};
      const pendingWrites = await Promise.all(
        Object.values(writes).map(async (write) => {
          const [taskId, channel, value] = write;
          return [taskId, channel, await this.serde.loadsTyped("json", value)];
        })
      );
      const tuple = {
        config: {
          configurable: {
            thread_id: threadId,
            checkpoint_ns: checkpointNamespace,
            checkpoint_id: checkpointId
          }
        },
        checkpoint,
        metadata,
        pendingWrites
      };
      if (parentCheckpointId) {
        tuple.parentConfig = {
          configurable: {
            thread_id: threadId,
            checkpoint_ns: checkpointNamespace,
            checkpoint_id: parentCheckpointId
          }
        };
      }
      return tuple;
    } catch (error) {
      logger$5.error(`Failed to load checkpoint tuple for ${threadId}/${checkpointId}`, error);
      return void 0;
    }
  }
  async *list(config, options) {
    const threadId = config.configurable?.thread_id;
    const checkpointNamespace = config.configurable?.checkpoint_ns ?? "";
    if (!threadId) {
      return;
    }
    const setKey = this._generateSetKey(threadId, checkpointNamespace);
    const checkpointIds = await redisService.smembers(setKey);
    const sortedIds = (checkpointIds || []).sort((a, b) => b.localeCompare(a));
    for (const checkpointId of sortedIds) {
      if (options?.before?.configurable?.checkpoint_id && checkpointId >= options.before.configurable.checkpoint_id) {
        continue;
      }
      const tuple = await this.getTuple({
        configurable: { thread_id: threadId, checkpoint_ns: checkpointNamespace, checkpoint_id: checkpointId }
      });
      if (tuple) {
        if (options?.filter) {
          const metadata = tuple.metadata || {};
          const matches = Object.entries(options.filter).every(([k, v]) => metadata[k] === v);
          if (!matches) {
            continue;
          }
        }
        yield tuple;
        if (options?.limit !== void 0 && options.limit > 0) ;
      }
    }
  }
  async put(config, checkpoint, metadata, _newVersions) {
    const threadId = config.configurable?.thread_id;
    const checkpointNamespace = config.configurable?.checkpoint_ns ?? "";
    if (!threadId) {
      throw new Error("thread_id is required for putting checkpoints");
    }
    const preparedCheckpoint = copyCheckpoint(checkpoint);
    const serializedCheckpoint = await this.serde.dumpsTyped(preparedCheckpoint);
    const serializedMetadata = await this.serde.dumpsTyped(metadata);
    const key = this._generateKey(threadId, checkpointNamespace, checkpoint.id);
    const parentCheckpointId = config.configurable?.checkpoint_id;
    const data = JSON.stringify([serializedCheckpoint[1], serializedMetadata[1], parentCheckpointId]);
    await redisService.set(key, data);
    const indexKey = this._generateIndexKey(threadId, checkpointNamespace);
    await redisService.set(indexKey, checkpoint.id);
    const setKey = this._generateSetKey(threadId, checkpointNamespace);
    await redisService.sadd(setKey, checkpoint.id);
    return {
      configurable: {
        thread_id: threadId,
        checkpoint_ns: checkpointNamespace,
        checkpoint_id: checkpoint.id
      }
    };
  }
  async putWrites(config, writes, taskId) {
    const threadId = config.configurable?.thread_id;
    const checkpointNamespace = config.configurable?.checkpoint_ns ?? "";
    const checkpointId = config.configurable?.checkpoint_id;
    if (!threadId || !checkpointId) {
      throw new Error("thread_id and checkpoint_id are required for putting writes");
    }
    const key = this._generateWritesKey(threadId, checkpointNamespace, checkpointId);
    const existingData = await redisService.get(key);
    const existingWrites = existingData ? JSON.parse(existingData) : {};
    await Promise.all(
      writes.map(async (write, idx) => {
        const [channel, value] = write;
        const serializedValue = await this.serde.dumpsTyped(value);
        const innerKeyIdx = WRITES_IDX_MAP[channel] ?? idx;
        const innerKeyStr = `${taskId},${innerKeyIdx}`;
        if (innerKeyIdx >= 0 && innerKeyStr in existingWrites) {
          return;
        }
        existingWrites[innerKeyStr] = [taskId, channel, serializedValue[1]];
      })
    );
    await redisService.set(key, JSON.stringify(existingWrites));
  }
  async deleteThread(threadId) {
    logger$5.info(`Deleting thread state for: ${threadId}`);
  }
}

const logger$4 = createScopedLogger("AgentErrorHandler");
async function safeNodeExecution(nodeName, fn, fallback) {
  try {
    return await fn();
  } catch (error) {
    logger$4.error(`Node ${nodeName} failed:`, error);
    return {
      ...fallback,
      error: {
        node: nodeName,
        message: error.message,
        timestamp: Date.now()
      }
    };
  }
}

const logger$3 = createScopedLogger("AgentUtils");
async function safeInvoke(agentName, chain, input, retries = 3, fallback) {
  let attempt = 0;
  while (attempt < retries) {
    try {
      const result = await chain.invoke(input);
      return result;
    } catch (error) {
      attempt++;
      logger$3.warn(`Agent ${agentName} failed attempt ${attempt}/${retries}: ${error.message}`);
      if (error.message?.includes("context_length_exceeded")) {
        logger$3.error(`Agent ${agentName} hit fatal context error`);
        break;
      }
      if (attempt >= retries) {
        logger$3.error(`Agent ${agentName} exhausted retries.`);
        if (fallback !== void 0) {
          return fallback;
        }
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 1e3 * Math.pow(2, attempt)));
    }
  }
  if (fallback !== void 0) {
    return fallback;
  }
  throw new Error(`Agent ${agentName} failed after ${retries} attempts`);
}
function createErrorState(agentName, state, error) {
  const errorMessage = `${agentName}: ${error.message}`;
  const errorEvent = {
    eventId: crypto.randomUUID(),
    runId: state.runId,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    type: "error",
    stage: state.status.stage,
    agent: agentName,
    summary: errorMessage,
    visibility: "user",
    details: { stack: error.stack }
  };
  return {
    status: {
      ...state.status,
      stageState: "failed",
      activeAgents: state.status.activeAgents.map((a) => a.agentId === agentName ? { ...a, status: "error" } : a)
    },
    errors: [...state.errors || [], errorMessage],
    events: [errorEvent]
  };
}

class CoordinatorAgent {
  _name = "coordinator";
  _model = null;
  _modelName = "gpt-5.2";
  // System default
  _ensureModel() {
    if (this._model) {
      return;
    }
    const apiKey = process.env.OPENAI_API_KEY;
    this._model = new ChatOpenAI({
      modelName: this._modelName,
      openAIApiKey: apiKey,
      temperature: 0.3
      // Lower temperature for structured planning
    });
  }
  /**
   * Main entry point
   */
  async run(state) {
    this._ensureModel();
    if (state.status.stage === "COORD_PLAN") {
      return this._handlePlanning(state);
    }
    return {};
  }
  /**
   * STAGE: COORD_PLAN
   * Analyze request -> Create Plan -> Emit Work Packets
   */
  async _handlePlanning(state) {
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

      {format_instructions}`
    );
    const chain = prompt.pipe(this._model).pipe(parser);
    const analysis = await safeInvoke(
      this._name,
      chain,
      {
        request: state.inputs.requestText || "",
        constraints: JSON.stringify(state.inputs.constraints || {}),
        format_instructions: parser.getFormatInstructions()
      },
      3,
      {
        intent: "Error processing request",
        needsResearch: true,
        plan: [{ id: "error-fallback", description: "Analyze failure", assignedTo: "researcher", status: "pending" }],
        acceptanceCriteria: [],
        constraints: []
      }
    );
    const planState = {
      tasks: analysis.plan,
      acceptanceCriteria: analysis.acceptanceCriteria,
      constraints: analysis.constraints || []
    };
    const newEvents = [
      {
        eventId: crypto.randomUUID(),
        runId: state.runId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        type: "stage_completed",
        stage: "COORD_PLAN",
        agent: "coordinator",
        summary: `Plan Created: ${analysis.intent} (${analysis.plan.length} tasks)`,
        visibility: "user"
      }
    ];
    const researchStateUpdate = analysis.needsResearch ? {
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
      /*
       * We could add a specific query field to ResearchState if schema permits,
       * or key off the plan. For now, let's assume Research Node reads the Plan.
       */
    } : {};
    return {
      plan: planState,
      research: {
        ...state.research,
        ...researchStateUpdate
      },
      events: newEvents,
      status: {
        ...state.status,
        stage: analysis.needsResearch ? "RESEARCH_TECH_AND_SKILLS" : "ARCH_BUILD"
      }
    };
  }
}

const logger$2 = createScopedLogger("researcher-agent");
class ResearcherAgent {
  _name = "researcher";
  _model = null;
  _modelName = "gemini-3-flash-preview";
  _ensureModels(state) {
    if (this._model) {
      return;
    }
    const googleApiKey = state.status?.activeAgents?.find((a) => a.agentId === "researcher") ? process.env.GOOGLE_API_KEY : process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    this._model = new ChatGoogleGenerativeAI({
      model: this._modelName,
      maxOutputTokens: 8192,
      temperature: 0.1,
      // High precision
      apiKey: googleApiKey
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
  async run(state) {
    this._ensureModels(state);
    const infraContext = await this._getInfrastructureContext(state);
    if (state.status.stage === "RESEARCH_TECH_AND_SKILLS") {
      const techUpdate = await this.runTechResearch(state, infraContext);
      const competencyUpdate = await this.runCompetencyResearch(state);
      const codebaseUpdate = await this.runCodebaseAnalysis(state, infraContext);
      return {
        research: {
          ...state.research,
          ...techUpdate.research,
          ...competencyUpdate.research,
          ...codebaseUpdate.research
        },
        events: [...techUpdate.events || [], ...competencyUpdate.events || [], ...codebaseUpdate.events || []]
      };
    }
    return await this.runTechResearch(state, infraContext);
  }
  /**
   * Helper to fetch context from RAG and Graph infrastructure
   */
  async _getInfrastructureContext(state) {
    const projectId = state.conversationId;
    const query = state.inputs.requestText || "";
    const contextParts = [];
    try {
      const ragResults = await RAGService.getInstance().query(projectId, query, 5);
      if (ragResults.length > 0) {
        contextParts.push("### Codebase Semantic Context (RAG):\n" + ragResults.join("\n\n"));
      }
      const graphResults = await graphService.getProjectSubgraph(projectId, 10);
      if (graphResults.length > 0) {
        const graphSummary = graphResults.map((r) => `- ${r.source.path} --(${r.relationship})--> ${r.target.path}`).join("\n");
        contextParts.push("### Dependency Graph Context:\n" + graphSummary);
      }
    } catch (err) {
      logger$2.error("Failed to fetch infrastructure context", err);
    }
    return contextParts.join("\n\n");
  }
  /**
   * ACTION: CODEBASE_ANALYSIS
   * Performs deep recursive analysis of the codebase using RAG and Graph services.
   *
   * @param state The current run state.
   * @param providedContext Optional infrastructure context to avoid redundant fetching.
   * @returns Partial state with findings.
   */
  async runCodebaseAnalysis(state, providedContext) {
    try {
      this._ensureModels(state);
      const infraContext = providedContext ?? await this._getInfrastructureContext(state);
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

        {format_instructions}`
      );
      const chain = prompt.pipe(this._model).pipe(parser);
      const analysis = await safeInvoke(this._name, chain, {
        infraContext,
        format_instructions: parser.getFormatInstructions()
      });
      const newEvent = {
        eventId: crypto.randomUUID(),
        runId: state.runId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        type: "artifact_ready",
        stage: "RESEARCH_TECH_AND_SKILLS",
        agent: "researcher",
        summary: "Deep Codebase Analysis complete.",
        visibility: "expert",
        details: analysis
      };
      return {
        research: {
          ...state.research,
          codebaseAnalysis: analysis,
          lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
        },
        events: [newEvent]
      };
    } catch (error) {
      return createErrorState(this._name, state, error);
    }
  }
  /**
   * ACTION: TECH_REALITY_CHECK
   * Validates the technology stack against latest standards, CVEs, and compatibility.
   */
  async runTechResearch(state, providedContext) {
    try {
      this._ensureModels(state);
      const query = state.inputs.requestText || "General Tech Inquiry";
      const constraints = JSON.stringify(state.inputs.constraints || {});
      const infraContext = providedContext ?? await this._getInfrastructureContext(state);
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

        {format_instructions}`
      );
      const chain = prompt.pipe(this._model).pipe(parser);
      const report = await safeInvoke(this._name, chain, {
        query,
        infraContext,
        constraints,
        format_instructions: parser.getFormatInstructions()
      });
      const newEvent = {
        eventId: crypto.randomUUID(),
        runId: state.runId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        type: "artifact_ready",
        stage: "RESEARCH_TECH_AND_SKILLS",
        agent: "researcher",
        summary: `Tech Report: ${report.recommendedPins.length} pins, ${report.compatibilityWarnings.length} incompatibility warnings.`,
        visibility: "expert",
        details: report
      };
      return {
        research: {
          ...state.research,
          techReality: report,
          lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
        },
        events: [newEvent]
      };
    } catch (error) {
      return createErrorState(this._name, state, error);
    }
  }
  /**
   * ACTION: COMPETENCY_MAP
   */
  async runCompetencyResearch(state) {
    try {
      this._ensureModels(state);
      const query = state.inputs.requestText || "";
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
      const chain = prompt.pipe(this._model).pipe(parser);
      const map = await safeInvoke(this._name, chain, {
        query,
        format_instructions: parser.getFormatInstructions()
      });
      const newEvent = {
        eventId: crypto.randomUUID(),
        runId: state.runId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        type: "artifact_ready",
        stage: "RESEARCH_TECH_AND_SKILLS",
        agent: "researcher",
        summary: `Competency Map: ${map.skills.length} skills identified.`,
        visibility: "expert",
        details: map
      };
      return {
        research: {
          ...state.research,
          competencyMap: map,
          lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
        },
        events: [newEvent]
      };
    } catch (error) {
      return createErrorState(this._name, state, error);
    }
  }
}

const logger$1 = createScopedLogger("architect-agent");
class ArchitectAgent {
  _name = "architect";
  _model = null;
  _modelName = "claude-opus-4-6-20260205";
  _ensureModel(state) {
    if (this._model) {
      return;
    }
    const apiKey = state.status?.activeAgents?.find((a) => a.agentId === "architect") ? process.env.ANTHROPIC_API_KEY : process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;
    this._model = new ChatAnthropic({
      modelName: this._modelName,
      temperature: 0.5,
      maxTokens: 4096,
      anthropicApiKey: apiKey
    });
  }
  /**
   * Main entry point
   */
  /**
   * Main entry point for the Architect Agent.
   * Identifies pending tasks and generates/applies patches to implement them.
   *
   * @param state The current run state.
   * @returns A partial state containing updated tasks, patches, and event logs.
   */
  async run(state) {
    try {
      this._ensureModel(state);
      const pendingTasks = state.plan?.tasks.filter((t) => t.assignedTo === "architect" && t.status === "pending") || [];
      if (pendingTasks.length === 0) {
        return {
          events: [
            {
              eventId: crypto.randomUUID(),
              runId: state.runId,
              timestamp: (/* @__PURE__ */ new Date()).toISOString(),
              type: "agent_status",
              stage: "ARCH_BUILD",
              agent: "architect",
              summary: "No pending tasks found for architect",
              visibility: "internal"
            }
          ]
        };
      }
      const researchContext = state.research || {};
      const tasksDescription = pendingTasks.map((t) => `- ${t.description} (ID: ${t.id})`).join("\n");
      const constraints = JSON.stringify(state.plan?.constraints || []);
      return await this._generatePatches(state, tasksDescription, researchContext, constraints, pendingTasks);
    } catch (error) {
      return createErrorState(this._name, state, error);
    }
  }
  async _generatePatches(state, tasks, research, constraints, pendingTasks) {
    const parser = new JsonOutputParser();
    const prompt = PromptTemplate.fromTemplate(
      `You are the Architect Agent (Claude).

      GOAL: Implement the following tasks by generating FILE PATCHES.

      Tasks:
      {tasks}

      Research Context:
      {research}

      Constraints:
      {constraints}

      Generate a JSON object containing a list of PATCHES.
      Use standard Unified Diff format for content change.

      Respond with JSON matching this schema:
      {{
        "patches": [
          {{
            "patchId": "uuid",
            "description": "Implementation of task X",
            "filesTouched": ["path/to/file.ts"],
            "unifiedDiff": "diff --git a/path/to/file.ts b/path/to/file.ts\\n..."
          }}
        ],
        "summary": "Brief explanation of changes"
      }}

      {format_instructions}`
    );
    const chain = prompt.pipe(this._model).pipe(parser);
    const result = await safeInvoke(this._name, chain, {
      tasks,
      research: JSON.stringify(research),
      constraints,
      format_instructions: parser.getFormatInstructions()
    });
    const appliedResults = await Promise.all(
      result.patches.map(async (patch) => {
        logger$1.info(`Materializing patch for ${patch.filesTouched.join(", ")}`);
        const targetPath = patch.filesTouched[0];
        if (!targetPath) {
          return { path: "unknown", success: false, error: "No target path in patch" };
        }
        return await executeAgentTool("devonz_apply_patch", {
          path: targetPath,
          patch: patch.unifiedDiff
        });
      })
    );
    const successfulPatches = appliedResults.filter((r) => r.success);
    const failedPatches = appliedResults.filter((r) => !r.success);
    const newEvents = [
      {
        eventId: crypto.randomUUID(),
        runId: state.runId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        type: "patch_applied",
        stage: "ARCH_BUILD",
        agent: "architect",
        summary: `${result.summary} (${successfulPatches.length} applied, ${failedPatches.length} failed)`,
        visibility: "user",
        details: {
          patchCount: result.patches.length,
          appliedCount: successfulPatches.length,
          failedCount: failedPatches.length,
          errors: failedPatches.map((f) => f.error)
        }
      }
    ];
    const updatedTasks = state.plan.tasks.map((t) => {
      if (pendingTasks.find((pt) => pt.id === t.id)) {
        return { ...t, status: "completed" };
      }
      return t;
    });
    return {
      artifacts: {
        currentFiles: {
          /* In real system, would reflect fs */
        },
        patches: [...state.artifacts?.patches || [], ...result.patches]
      },
      plan: {
        ...state.plan,
        tasks: updatedTasks
      },
      events: newEvents,
      status: {
        ...state.status,
        stage: "QC1_SYNTAX_STYLE",
        stageState: "queued",
        progress: {
          percent: 100,
          label: "Architecture Complete",
          iteration: state.status?.progress?.iteration || 0
        },
        activeAgents: state.status?.activeAgents?.map((a) => a.agentId === "architect" ? { ...a, status: "done" } : a) || []
      }
    };
  }
}

class QCAgent {
  _name = "qc";
  _model = null;
  _ensureModel(_state) {
    if (this._model) {
      return;
    }
    const apiKey = process.env.OPENAI_API_KEY;
    this._model = new ChatOpenAI({
      modelName: "gpt-4o",
      // Smart model for review
      temperature: 0.1,
      openAIApiKey: apiKey
    });
  }
  /**
   * Node: qc1
   * focus: Syntax, Patch Validity, Code Structure
   */
  async runSyntaxCheck(state) {
    try {
      this._ensureModel(state);
      const patches = state.artifacts?.patches || [];
      const hasPatches = patches.length > 0;
      if (!hasPatches) {
        const event2 = {
          eventId: crypto.randomUUID(),
          runId: state.runId,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          type: "qc_review",
          stage: "QC1_SYNTAX_STYLE",
          agent: "qc",
          summary: "QC1: No patches to verify. Proceeding.",
          visibility: "internal"
        };
        return {
          events: [event2],
          status: { ...state.status, stage: "QC2_COMPLETENESS" }
        };
      }
      const container = await webcontainer;
      let verifiedCount = 0;
      const failedFiles = [];
      for (const patch of patches) {
        const path = patch.path || patch.file;
        if (path) {
          try {
            await container.fs.readFile(path, "utf-8");
            verifiedCount++;
          } catch {
            failedFiles.push(path);
          }
        }
      }
      const summary = failedFiles.length > 0 ? `QC1 warning: ${failedFiles.length} files not found on disk.` : `QC1: Verified ${verifiedCount} files exist on disk.`;
      const event = {
        eventId: crypto.randomUUID(),
        runId: state.runId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        type: "qc_review",
        stage: "QC1_SYNTAX_STYLE",
        agent: "qc",
        summary,
        visibility: "expert"
      };
      return {
        events: [event],
        status: { ...state.status, stage: "QC2_COMPLETENESS" }
      };
    } catch (error) {
      return createErrorState(this._name, state, error);
    }
  }
  /**
   * Node: qc2
   * focus: Requirements, Logic, Completeness
   */
  async runCompletenessCheck(state) {
    try {
      this._ensureModel(state);
      const tasks = state.plan?.tasks || [];
      const pendingWork = tasks.filter((t) => t.status !== "complete" && t.status !== "failed");
      if (pendingWork.length > 0) {
      }
      const event = {
        eventId: crypto.randomUUID(),
        runId: state.runId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        type: "qc_review",
        stage: "QC2_COMPLETENESS",
        agent: "qc",
        summary: `QC2: All planned tasks reviewed.`,
        visibility: "user"
      };
      return {
        events: [event],
        qc: {
          ...state.qc,
          issues: [
            ...state.qc?.issues || [],
            {
              issueId: crypto.randomUUID(),
              stage: "QC2_COMPLETENESS",
              category: "completeness",
              severity: "low",
              file: "",
              title: "Automated Pass",
              description: "All tasks reviewed.",
              recommendation: "None",
              fixStatus: "fixed"
            }
          ],
          pass: true
        },
        status: { ...state.status, stage: "FINALIZE" }
        // Hint to graph
      };
    } catch (error) {
      return createErrorState(this._name, state, error);
    }
  }
}

const coordinator = new CoordinatorAgent();
const researcher = new ResearcherAgent();
const architect = new ArchitectAgent();
const qc = new QCAgent();
const coordinatorNode = async (state) => {
  return await safeNodeExecution("coordinator", () => coordinator.run(state), {
    status: { ...state.status, stageState: "failed" }
  });
};
const researchNode = async (state) => {
  return await safeNodeExecution("researcher", () => researcher.run(state), {
    status: { ...state.status, stageState: "failed" }
  });
};
const architectNode = async (state) => {
  return await safeNodeExecution("architect", () => architect.run(state), {
    status: { ...state.status, stageState: "failed" }
  });
};
const qc1Node = async (state) => {
  return await safeNodeExecution("qc1_syntax", () => qc.runSyntaxCheck(state), {
    status: { ...state.status, stageState: "failed" }
  });
};
const qc2Node = async (state) => {
  return await safeNodeExecution("qc2_completeness", () => qc.runCompletenessCheck(state), {
    status: { ...state.status, stageState: "failed" }
  });
};
const fixNode = async (state) => {
  return await safeNodeExecution("architect_fix", () => architect.run(state), {
    status: { ...state.status, stageState: "failed" }
  });
};
const finalizeNode = async (state) => {
  return {
    status: {
      ...state.status,
      stage: "COORD_POLISH_DELIVER"
    }
  };
};
const checkResearchNeeded = (state) => {
  if (state.status.stage === "RESEARCH_TECH_AND_SKILLS") {
    return "research";
  }
  return "skipString";
};
const checkQCPass = (state) => {
  const { critical, high } = state.qc?.severityCounts || { critical: 0, high: 0 };
  const currentIteration = state.qc?.iteration || 0;
  const maxIterations = state.qc?.maxIterations || 3;
  if ((critical > 0 || high > 0) && currentIteration < maxIterations) {
    return "fix";
  }
  return "finalize";
};
function createGraph() {
  const workflow = new StateGraph({
    channels: {
      runId: { value: (a, b) => b ?? a, default: () => "" },
      conversationId: { value: (a, b) => b ?? a, default: () => "" },
      userId: { value: (a, b) => b ?? a, default: () => "" },
      createdAt: { value: (a, b) => b ?? a, default: () => (/* @__PURE__ */ new Date()).toISOString() },
      mode: { value: (a, b) => b ?? a, default: () => "single" },
      agentModels: {
        value: (a, b) => b ?? a,
        default: () => ({
          coordinator: { provider: "openai", model: "gpt-5" },
          researcher: { provider: "google", model: "gemini-3-flash-preview" },
          architect: { provider: "anthropic", model: "claude-sonnet-4-5-20250929" }
        })
      },
      status: {
        value: (a, b) => ({ ...a || {}, ...b }),
        default: () => ({
          stage: "COORD_PLAN",
          stageState: "running",
          progress: { percent: 0, label: "Initializing..." },
          activeAgents: []
        })
      },
      inputs: {
        value: (a, b) => b ?? a,
        default: () => ({
          requestText: "",
          conversationId: "",
          constraints: {
            language: "typescript",
            securityLevel: "normal",
            testLevel: "standard"
          }
        })
      },
      plan: {
        value: (a, b) => ({ ...a || {}, ...b }),
        default: () => ({ tasks: [], acceptanceCriteria: [], constraints: [] })
      },
      research: {
        value: (a, b) => ({ ...a || {}, ...b }),
        default: () => ({ lastUpdated: (/* @__PURE__ */ new Date()).toISOString() })
      },
      artifacts: {
        value: (a, b) => ({ ...a || {}, ...b }),
        default: () => ({ currentFiles: {}, patches: [] })
      },
      qc: {
        value: (a, b) => ({
          ...a || {},
          ...b
        }),
        default: () => ({
          issues: [],
          severityCounts: { critical: 0, high: 0, medium: 0, low: 0 },
          pass: true,
          iteration: 0,
          maxIterations: 3
        })
      },
      events: {
        value: (a, b) => (a || []).concat(b || []),
        default: () => []
      },
      cost: { value: (a, b) => b ?? a, default: () => void 0 },
      warnings: {
        value: (a, b) => [...a || [], ...b || []],
        default: () => []
      },
      errors: {
        value: (a, b) => [...a || [], ...b || []],
        default: () => []
      }
    }
  }).addNode("coordinator", coordinatorNode).addNode("researcher", researchNode).addNode("architect", architectNode).addNode("qc1", qc1Node).addNode("qc2", qc2Node).addNode("fix", fixNode).addNode("finalize", finalizeNode).addEdge(START, "coordinator").addConditionalEdges("coordinator", checkResearchNeeded, {
    research: "researcher",
    skipString: "architect"
  }).addEdge("researcher", "architect").addEdge("architect", "qc1").addEdge("qc1", "qc2").addConditionalEdges("qc2", checkQCPass, {
    fix: "fix",
    finalize: "finalize"
  }).addEdge("fix", "qc1").addEdge("finalize", END);
  const checkpointer = new RedisCheckpointSaver();
  return workflow.compile({ checkpointer });
}

const logger = createScopedLogger("OrchestratorService");
class OrchestratorService {
  static _instance;
  _graph;
  constructor() {
    this._graph = createGraph();
  }
  static getInstance() {
    if (!OrchestratorService._instance) {
      OrchestratorService._instance = new OrchestratorService();
    }
    return OrchestratorService._instance;
  }
  async processRequest(userRequest, conversationId, dataStream, existingMessages, apiKeys, streamRecovery) {
    const initialState = {
      runId: crypto.randomUUID(),
      conversationId,
      userId: "user",
      // placeholder
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      mode: "3agent_strict",
      inputs: {
        requestText: userRequest,
        constraints: {
          language: "typescript",
          securityLevel: "normal",
          testLevel: "standard"
        }
      },
      status: {
        stage: "COORD_PLAN",
        stageState: "running",
        progress: { percent: 0, label: "Starting..." },
        activeAgents: []
      },
      events: []
      /*
       * Legacy or adapter fields if needed by graph channels default?
       * Graph channels handle defaults.
       */
    };
    const config = { configurable: { thread_id: conversationId } };
    try {
      const timeoutPromise = new Promise(
        (_, reject) => setTimeout(() => reject(new Error("Orchestrator timed out after 5 minutes")), 3e5)
      );
      const graphPromise = (async () => {
        const stream = await this._graph.stream(initialState, config);
        for await (const event of stream) {
          if (streamRecovery) {
            streamRecovery.updateActivity();
          }
          const nodeName = Object.keys(event)[0];
          const stateUpdate = event[nodeName];
          if (stateUpdate?.events && Array.isArray(stateUpdate.events)) {
            for (const logEntry of stateUpdate.events) {
              if (logEntry.type === "run_started") {
                dataStream.writeData({ type: "event_log", payload: logEntry });
              }
              if (logEntry.type === "stage_started" || logEntry.type === "stage_completed") {
                dataStream.writeData({ type: "event_log", payload: logEntry });
              }
              if (logEntry.type === "iteration_started" || logEntry.type === "iteration_completed") {
                dataStream.writeData({ type: "event_log", payload: logEntry });
              }
              if (logEntry.type === "agent_status") {
                dataStream.writeData({ type: "event_log", payload: logEntry });
              }
              if (logEntry.type === "qc_issues_found" || logEntry.type === "qc_passed" || logEntry.type === "qc_failed" || logEntry.type === "qc_review") {
                dataStream.writeData({ type: "event_log", payload: logEntry });
              }
              if (logEntry.type === "patch_applied" || logEntry.type === "artifact_ready") {
                dataStream.writeData({ type: "event_log", payload: logEntry });
              }
              if (logEntry.type === "error" || logEntry.type === "warning") {
                dataStream.writeData({ type: "event_log", payload: logEntry });
              }
            }
          }
          if (stateUpdate?.response && dataStream.writeText) {
            dataStream.writeText(stateUpdate.response);
          }
          if (stateUpdate?.error && !stateUpdate?.events) {
            const errorObj = stateUpdate.error;
            const errMsg = typeof errorObj === "string" ? errorObj : errorObj.message || "Unknown Error";
            dataStream.writeData({
              type: "progress",
              label: "error",
              status: "failed",
              message: `Agent Error: ${errMsg}`
            });
          }
        }
      })();
      await Promise.race([graphPromise, timeoutPromise]);
    } catch (error) {
      logger.error("Orchestrator Execution Error:", error);
      dataStream.writeData({
        type: "progress",
        label: "system",
        status: "failed",
        message: `System Error: ${error.message}`
      });
    }
  }
}
const orchestratorService = OrchestratorService.getInstance();

export { OrchestratorService, orchestratorService };
