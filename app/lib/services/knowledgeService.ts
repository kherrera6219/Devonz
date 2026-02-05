import { minioService } from './minioService';
import { RAGService } from './ragService';
import { graphService } from './graphService';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('knowledge-service');

export class KnowledgeService {
  private static _instance: KnowledgeService;
  private _ragService: RAGService;

  private constructor() {
    this._ragService = RAGService.getInstance();
  }

  static getInstance(): KnowledgeService {
    if (!KnowledgeService._instance) {
      KnowledgeService._instance = new KnowledgeService();
    }
    return KnowledgeService._instance;
  }

  /**
   * Orchestrates the ingestion of a project's files across all storage layers.
   */
  async ingestProject(projectId: string, files: Record<string, string>) {
    logger.info(`Starting ingestion for project: ${projectId} (${Object.keys(files).length} files)`);

    try {
      // 1. MinIO Ingestion (Object Storage) & Base File Nodes
      const uploadPromises = Object.entries(files).map(async ([path, content]) => {
        await minioService.uploadFile(path, content, 'text/plain', projectId);
        await graphService.addFileNode(projectId, path);
      });

      await Promise.all(uploadPromises);

      // 2. RAG Indexing (Vector Storage)
      await this._ragService.indexFiles(projectId, files);

      /**
       * 3. Dependency Extraction (Graph Storage)
       * Basic dependency extraction: Look for 'import' statements
       */
      for (const [path, content] of Object.entries(files)) {
        const importRegex = /from\s+['"]((?:\.\/|\.\.\/)[^'"]+)['"]/g;
        let match;
        while ((match = importRegex.exec(content)) !== null) {
          const rawTarget = match[1];
          const resolvedTarget = this._resolvePath(path, rawTarget);

          // Try to match the target with potential extensions
          const potentialPaths = [
            resolvedTarget,
            `${resolvedTarget}.ts`,
            `${resolvedTarget}.tsx`,
            `${resolvedTarget}.js`,
            `${resolvedTarget}.jsx`,
          ];

          for (const targetPath of potentialPaths) {
            if (files[targetPath]) {
              await graphService.addDependency(projectId, path, targetPath);
              break;
            }
          }
        }
      }

      logger.info(`Successfully ingested project: ${projectId}`);
    } catch (error) {
      logger.error(`Failed to ingest project: ${projectId}`, error);
      throw error;
    }
  }

  /**
   * Resolves a relative target path against a source file path
   */
  private _resolvePath(sourcePath: string, targetPath: string): string {
    const sourceParts = sourcePath.split('/');
    sourceParts.pop(); // Remove filename to get directory parts

    const targetParts = targetPath.split('/');

    for (const part of targetParts) {
      if (part === '.') continue;
      if (part === '..') {
        sourceParts.pop();
      } else {
        sourceParts.push(part);
      }
    }

    return sourceParts.join('/');
  }

  /**
   * Queries the unified knowledge system
   */
  async query(projectId: string, query: string, topK: number = 5) {
    logger.info(`Querying knowledge engine for project: ${projectId}`);

    try {
      // 1. Vector Search
      const vectorResults = await this._ragService.query(projectId, query, topK);

      // 2. Graph Enhancement (Lazy Graph RAG)
      // Extract file paths from vector results and look for related nodes
      const relatedFiles: string[] = [];
      for (const result of vectorResults) {
        const pathLine = result.split('\n')[0];
        if (pathLine.startsWith('File: ')) {
          const path = pathLine.substring(6);
          relatedFiles.push(path);
        }
      }

      // TODO: Implement deeper graph-based context gathering here
      // For now, we return the vector results as the baseline

      return vectorResults;
    } catch (error) {
      logger.error(`Knowledge query failed for project: ${projectId}`, error);
      return [];
    }
  }

  async getProjectSubgraph(projectId: string) {
    return await graphService.getProjectSubgraph(projectId);
  }

  /**
   * Deletes all data associated with a project
   */
  async deleteProject(projectId: string) {
    logger.info(`Deleting all data for project: ${projectId}`);

    try {
      await minioService.deleteFolder('', projectId);
      await this._ragService.deleteProjectIndex(projectId);
      // TODO: Implement global project node cleanup in graphService if needed
      logger.info(`Project ${projectId} deleted successfully`);
    } catch (error) {
      logger.error(`Failed to delete project: ${projectId}`, error);
    }
  }
}

export const knowledgeService = KnowledgeService.getInstance();
