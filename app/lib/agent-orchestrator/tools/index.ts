/**
 * Unified Agent Tool Registry
 *
 * Central registry for all tools available to the multi-agent orchestration system.
 * Integrates base agent tools from agentToolsService with enhanced test tools.
 */

import { tool } from '@langchain/core/tools';
import { z } from 'zod';

// Import base agent tools from agentToolsService
import { agentToolDefinitions } from '~/lib/services/agentToolsService';

// Import enhanced test tools (not in base agent)
import { testTools } from './test-tools';

// Import database tools for knowledge access
import { databaseTools } from './database-tools';

// Tool result type for state tracking
export interface ToolResult {
  tool: string;
  success: boolean;
  output: string;
  error?: string;
  timestamp: number;
}

/**
 * Map base agent tool definitions to LangChain tools
 * This bridges the Vercel AI SDK format to LangChain format
 */
function convertBaseAgentTool(name: string, definition: any) {
  const schema = z.object(
    Object.entries(definition.parameters.properties || {}).reduce(
      (acc, [key, prop]: [string, any]) => {
        let zodType = z.string();

        if (prop.type === 'number') zodType = z.number();
        if (prop.type === 'boolean') zodType = z.boolean();

        acc[key] = definition.parameters.required?.includes(key)
          ? zodType.describe(prop.description || '')
          : zodType.optional().describe(prop.description || '');

        return acc;
      },
      {} as Record<string, z.ZodTypeAny>,
    ),
  );

  return tool(
    async (input) => {
      try {
        const result = await definition.execute(input);

        if (result.success) {
          return JSON.stringify(result.data || result);
        }

        return `Error: ${result.error}`;
      } catch (error: any) {
        return `Error: ${error.message}`;
      }
    },
    {
      name,
      description: definition.description,
      schema,
    },
  );
}

// Convert and export base agent tools for LangChain
export const baseAgentTools = Object.entries(agentToolDefinitions).reduce(
  (acc, [name, definition]) => {
    acc[name] = convertBaseAgentTool(name, definition);

    return acc;
  },
  {} as Record<string, ReturnType<typeof tool>>,
);

// Combined tool registry - all tools available to agents
export const agentTools = {
  // Base agent tools (file, terminal, media generation, knowledge)
  ...baseAgentTools,
  // Enhanced test tools
  ...testTools,
  // Database tools (graph, vector, storage)
  ...databaseTools,
};

// Tool categories for role-based access
export const toolCategories = {
  coordinator: Object.keys(agentTools), // All tools
  researcher: [
    'devonz_knowledge_query',
    'devonz_search_code',
    'devonz_read_file',
    'devonz_list_directory',
    'devonz_read_document',
    'graphQuery',
    'vectorSearch',
  ],
  architect: [
    'devonz_read_file',
    'devonz_write_file',
    'devonz_run_command',
    'devonz_list_directory',
    'devonz_search_code',
    'devonz_generate_image',
    'devonz_generate_audio',
    'devonz_generate_document',
    'devonz_get_errors',
    'runTests',
    'runTypeCheck',
    'runLint',
  ],
};

// Get tools for a specific agent role
export function getToolsForRole(role: keyof typeof toolCategories) {
  const allowedTools = toolCategories[role];

  return Object.entries(agentTools)
    .filter(([name]) => allowedTools.includes(name))
    .reduce(
      (acc, [name, t]) => {
        acc[name] = t;

        return acc;
      },
      {} as Record<string, ReturnType<typeof tool>>,
    );
}

// Create formatted tool list for agent prompts
export function getToolDescriptions(role?: keyof typeof toolCategories): string {
  const tools = role ? getToolsForRole(role) : agentTools;

  const descriptions = [
    '**Available Tools:**',
    '',
    '**File Operations:**',
    '- devonz_read_file(path, startLine?, endLine?): Read file contents',
    '- devonz_write_file(path, content): Write content to file',
    '- devonz_list_directory(path, recursive?): List directory contents',
    '',
    '**Code Analysis:**',
    '- devonz_search_code(query, path?, extensions?): Search for code patterns',
    '- devonz_get_errors(): Get current errors from autofix store',
    '- runTypeCheck(): Run TypeScript type checking',
    '- runLint(files?): Run ESLint analysis',
    '- runTests(pattern?): Run vitest tests',
    '',
    '**Terminal:**',
    '- devonz_run_command(command): Execute shell command',
    '',
    '**Media Generation:**',
    '- devonz_generate_image(prompt, path): Generate image with AI',
    '- devonz_generate_audio(text, path): Generate audio with TTS',
    '- devonz_generate_document(type, content, path): Generate PDF document',
    '',
    '**Knowledge & Database:**',
    '- devonz_knowledge_ingest(projectId, files): Ingest files to knowledge engine',
    '- devonz_knowledge_query(projectId, query): Query knowledge engine',
    '- graphQuery(projectId, query): Query Neo4j code graph',
    '- vectorSearch(projectId, query): Vector similarity search',
  ];

  return descriptions.join('\n');
}
