import { PromptTemplate } from '@langchain/core/prompts';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('PromptRegistry');

interface PromptVersion {
  version: string;
  template: string;
  timestamp: string;
  author: string;
}

interface PromptDefinition {
  id: string;
  description: string;
  currentVersion: string;
  versions: Record<string, PromptVersion>;
}

/**
 * AI Governance: Centralized Prompt Template Registry
 * Manages versioned system prompts for MAS agents.
 */
export class PromptRegistry {
  private static _instance: PromptRegistry;
  private _registry: Map<string, PromptDefinition> = new Map();

  private constructor() {
    this._initializeStaticRegistry();
  }

  static getInstance(): PromptRegistry {
    if (!PromptRegistry._instance) {
      PromptRegistry._instance = new PromptRegistry();
    }

    return PromptRegistry._instance;
  }

  /**
   * Registers a new prompt or a new version of an existing prompt.
   */
  registerPrompt(id: string, definition: PromptDefinition) {
    this._registry.set(id, definition);
    logger.info(`Registered prompt: ${id} (version ${definition.currentVersion})`);
  }

  /**
   * Retrieves a LangChain PromptTemplate for a specific prompt and version.
   */
  getTemplate(id: string, version?: string): PromptTemplate {
    const definition = this._registry.get(id);

    if (!definition) {
      throw new Error(`Prompt '${id}' not found in registry.`);
    }

    const v = version || definition.currentVersion;
    const promptVersion = definition.versions[v];

    if (!promptVersion) {
      throw new Error(`Version '${v}' for prompt '${id}' not found.`);
    }

    return PromptTemplate.fromTemplate(promptVersion.template);
  }

  /**
   * Gets the raw string template.
   */
  getRawTemplate(id: string, version?: string): string {
    const definition = this._registry.get(id);

    if (!definition) {
      throw new Error(`Prompt '${id}' not found`);
    }

    const v = version || definition.currentVersion;

    return definition.versions[v].template;
  }

  private _initializeStaticRegistry() {
    // Initial static prompts from MAS agents
    this.registerPrompt('coordinator', {
      id: 'coordinator',
      description: 'Main task planning and agent coordination prompt',
      currentVersion: '1.0.0',
      versions: {
        '1.0.0': {
          version: '1.0.0',
          timestamp: '2026-02-14T16:25:00Z',
          author: 'system',
          template: `You are the Coordinator Agent. Your task is to analyze the user request: {requestText}
and break it down into specialized tasks for Researcher, Architect, and QC agents.
Consider dependencies and existing context: {existingContext}`,
        },
      },
    });

    this.registerPrompt('researcher', {
      id: 'researcher',
      description: 'RAG and knowledge discovery prompt',
      currentVersion: '1.0.0',
      versions: {
        '1.0.0': {
          version: '1.0.0',
          timestamp: '2026-02-14T16:25:00Z',
          author: 'system',
          template: `You are the Researcher Agent. Research the following topic: {topic}
Use the available RAG and Graph tools to find technical dependencies and best practices.`,
        },
      },
    });

    this.registerPrompt('architect', {
      id: 'architect',
      description: 'Code generation and patch creation prompt',
      currentVersion: '1.0.0',
      versions: {
        '1.0.0': {
          version: '1.0.0',
          timestamp: '2026-02-14T16:25:00Z',
          author: 'system',
          template: `You are the Architect Agent. Implement the technical plan: {plan}
Generate unified diffs for the following files: {fileList}`,
        },
      },
    });

    this.registerPrompt('qc_agent', {
      id: 'qc_agent',
      description: 'Quality control and verification prompt',
      currentVersion: '1.0.0',
      versions: {
        '1.0.0': {
          version: '1.0.0',
          timestamp: '2026-02-14T16:25:00Z',
          author: 'system',
          template: `You are the QC Agent. Verify the proposed changes: {changes}
Check for security issues, lint errors, and test failures.`,
        },
      },
    });
  }
}

export const promptRegistry = PromptRegistry.getInstance();
