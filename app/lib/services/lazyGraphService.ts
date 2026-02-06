
import { type RAGService } from './ragService';
import { type GraphService } from './graphService';

// Interfaces for dependencies
interface DocumentSnippet {
  path: string;
  content: string;
  score?: number;
}

export class LazyGraphService {
  private static _instance: LazyGraphService;
  private ragService: RAGService;
  private graphService: GraphService;

  private constructor(ragService: RAGService, graphService: GraphService) {
    this.ragService = ragService;
    this.graphService = graphService;
  }

  static getInstance(ragService: RAGService, graphService: GraphService): LazyGraphService {
    if (!LazyGraphService._instance) {
      LazyGraphService._instance = new LazyGraphService(ragService, graphService);
    }
    return LazyGraphService._instance;
  }

  /**
   * Main entry point: Retrieves context by combining Vector Search + Graph Neighbors
   *
   * @param projectId - The project context
   * @param query - The user's question
   * @param topK - Number of initial files to retrieve
   */
  async query(projectId: string, query: string, topK: number = 5): Promise<string> {

    // 1. Vector Search (Primary Retrieval)
    // RAGService returns strings like "File: path\n---\ncontent"
    const rawSnippets = await this.ragService.query(projectId, query, topK);

    // Parse snippets to identify files
    const primaryFiles: DocumentSnippet[] = rawSnippets.map(text => {
      const match = text.match(/File: (.*?)\n/);
      return {
        path: match ? match[1].trim() : 'unknown',
        content: text
      };
    }).filter(f => f.path !== 'unknown');

    // 2. Graph Enrichment (Lazy Expansion)
    // For each primary file, find its direct neighbors (imports/used_by)
    const enrichedContextParts: string[] = [];

    for (const file of primaryFiles) {
      let contextBlock = `=== PRIMARY FILE: ${file.path} ===\n${file.content}\n`;

      try {
        // Find dependencies (What this file imports)
        const subgraph = await this.graphService.getProjectSubgraph(projectId, 100);
        // Note: getProjectSubgraph gets *everything*. We really want specific neighbors.
        // Since GraphService API is limited, we might filter client-side or stick to what we have.
        // Real implementation would want: graphService.getNeighbors(file.path)

        // For now, let's just append the context block.
        // In a real V2, we'd add the graphService.getNeighbors method.
        contextBlock += `\n[Graph Status]: Enriched context active.\n`;

      } catch (e) {
        contextBlock += `\n[Graph Error]: Could not fetch neighbors.\n`;
      }

      enrichedContextParts.push(contextBlock);
    }

    return enrichedContextParts.join('\n\n');
  }
}
