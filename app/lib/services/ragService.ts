import {
  VectorStoreIndex,
  Document,
  Settings,
  MetadataMode,
  storageContextFromDefaults,
  type BaseNode,
  type NodeWithScore,
  type Metadata,
} from 'llamaindex';
import pkg from 'pg';

const { Client: PG_CLIENT } = pkg;

import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('rag-service');

/**
 * Service to handle Retrieval-Augmented Generation (RAG) using LlamaIndex and pgvector.
 */
export class RAGService {
  private static _instance: RAGService;

  // Typed as any because PGVectorStore is dynamically imported to avoid build issues

  private _vectorStore?: any;
  private _isInitialized = false;

  private constructor() {
    // Private constructor for singleton pattern
  }

  static getInstance(): RAGService {
    if (!RAGService._instance) {
      RAGService._instance = new RAGService();
    }

    return RAGService._instance;
  }

  private async _initialize() {
    if (this._isInitialized) {
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const { PGVectorStore } = await import('@llamaindex/postgres');
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const { OpenAI, OpenAIEmbedding } = await import('@llamaindex/openai');

      const embeddingModel = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';

      Settings.llm = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-4o-mini',
      });

      Settings.embedModel = new OpenAIEmbedding({
        apiKey: process.env.OPENAI_API_KEY,
        model: embeddingModel,
      });

      // Map common models to their dimensions
      const dimensionMap: Record<string, number> = {
        'text-embedding-3-small': 1536,
        'text-embedding-3-large': 3072,
        'text-embedding-ada-002': 1536,
      };

      const dimensions = dimensionMap[embeddingModel] || 1536;

      this._vectorStore = new PGVectorStore({
        clientConfig: {
          connectionString: process.env.DATABASE_URL,
        },
        tableName: 'project_embeddings',
        schemaName: 'public',
        dimensions,
      });

      this._isInitialized = true;
      logger.info(`RAG Service initialized with PGVectorStore (${embeddingModel}, ${dimensions} dims)`);
    } catch (error) {
      logger.error('Failed to initialize RAG Service', error);
      throw error;
    }
  }

  async indexFiles(projectId: string, files: Record<string, string>): Promise<number> {
    await this._initialize();

    if (!this._vectorStore) {
      throw new Error('Vector store not initialized');
    }

    const documents = Object.entries(files).map(([path, content]) => {
      return new Document({
        text: content,
        metadata: { path, projectId },
      });
    });

    const storageContext = await storageContextFromDefaults({
      vectorStore: this._vectorStore,
    });

    await VectorStoreIndex.fromDocuments(documents, {
      storageContext,
    });

    logger.info(`Successfully indexed ${documents.length} files`);

    return documents.length;
  }

  async query(projectId: string, query: string, topK: number = 5): Promise<string[]> {
    await this._initialize();

    if (!this._vectorStore) {
      throw new Error('Vector store not initialized');
    }

    const index = await VectorStoreIndex.fromVectorStore(this._vectorStore);

    // Filter by projectId
    const retriever = index.asRetriever({
      similarityTopK: topK,
      filters: {
        filters: [
          {
            key: 'projectId',
            value: projectId,
            operator: '==',
          },
        ],
      },
    } as any);

    const nodesWithScores = await retriever.retrieve({ query });

    return (nodesWithScores as NodeWithScore<Metadata>[]).map((result) => {
      const node = result.node as BaseNode;
      const path = node.metadata.path;
      const content = node.getContent(MetadataMode.NONE);

      return `File: ${path}\n---\n${content}\n---`;
    });
  }

  async deleteProjectIndex(projectId: string) {
    await this._initialize();

    const client = new PG_CLIENT({
      connectionString: process.env.DATABASE_URL,
    });

    try {
      await client.connect();

      // Only delete rows matching this project
      await client.query("DELETE FROM project_embeddings WHERE metadata->>'projectId' = $1", [projectId]);
      logger.info(`Cleared RAG index for project: ${projectId}`);
    } catch (error) {
      logger.error(`Error clearing index for project: ${projectId}`, error);
    } finally {
      await client.end();
    }
  }

  async clearIndex() {
    await this._initialize();

    const client = new PG_CLIENT({
      connectionString: process.env.DATABASE_URL,
    });

    try {
      await client.connect();
      await client.query('TRUNCATE TABLE project_embeddings');
      logger.info('Global RAG index cleared');
    } catch (error) {
      logger.error('Error clearing global index', error);
    } finally {
      await client.end();
    }
  }
}
