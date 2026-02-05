/**
 * Database Tools for Multi-Agent System
 *
 * Provides access to knowledge graph, vector search, and object storage.
 */

import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { knowledgeService } from '~/lib/services/knowledgeService';
import { graphService } from '~/lib/services/graphService';
import { RAGService } from '~/lib/services/ragService';

/**
 * Graph Query Tool
 * Query the Neo4j knowledge graph for code relationships
 */
const graphQuery = tool(
  async ({ projectId, limit }) => {
    try {
      const result = await graphService.getProjectSubgraph(projectId, limit || 50);

      return JSON.stringify({
        success: true,
        nodeCount: result.length,
        relationships: result.slice(0, 20), // Limit output size
      });
    } catch (error: any) {
      return JSON.stringify({ success: false, error: error.message });
    }
  },
  {
    name: 'graphQuery',
    description:
      'Query the Neo4j code graph to understand file relationships and dependencies. Returns nodes and their connections.',
    schema: z.object({
      projectId: z.string().describe('Project ID to query'),
      limit: z.number().optional().describe('Maximum nodes to return (default 50)'),
    }),
  },
);

/**
 * Vector Search Tool
 * Semantic similarity search using pgvector embeddings
 */
const vectorSearch = tool(
  async ({ projectId, query, topK }) => {
    try {
      const ragService = RAGService.getInstance();
      const results = await ragService.query(projectId, query, topK || 5);

      return JSON.stringify({
        success: true,
        resultCount: results.length,
        results: results.slice(0, 5), // Limit output
      });
    } catch (error: any) {
      return JSON.stringify({ success: false, error: error.message });
    }
  },
  {
    name: 'vectorSearch',
    description:
      'Semantic similarity search across indexed project files. Finds contextually relevant code based on meaning.',
    schema: z.object({
      projectId: z.string().describe('Project ID to search'),
      query: z.string().describe('Natural language query'),
      topK: z.number().optional().describe('Number of results (default 5)'),
    }),
  },
);

/**
 * Knowledge Query Tool
 * Combined graph + vector search for comprehensive context
 */
const knowledgeQuery = tool(
  async ({ projectId, query, topK }) => {
    try {
      const results = await knowledgeService.query(projectId, query, topK || 5);

      return JSON.stringify({
        success: true,
        resultCount: results.length,
        context: results,
      });
    } catch (error: any) {
      return JSON.stringify({ success: false, error: error.message });
    }
  },
  {
    name: 'knowledgeQuery',
    description: 'Query the unified knowledge engine combining vector search with graph context for comprehensive results.',
    schema: z.object({
      projectId: z.string().describe('Project ID to query'),
      query: z.string().describe('Natural language query'),
      topK: z.number().optional().describe('Number of results (default 5)'),
    }),
  },
);

export const databaseTools = {
  graphQuery,
  vectorSearch,
  knowledgeQuery,
};
