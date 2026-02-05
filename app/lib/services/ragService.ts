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

export interface IndexResult {
  indexedCount: number;
  error?: string;
}

/**
 * Service to handle Retrieval-Augmented Generation (RAG) using LlamaIndex and pgvector.
 */
export class RAGService {
  private static _instance: RAGService;
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

      /**
       * LLM Settings - using OpenAI as default
       */
      Settings.llm = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-4o-mini',
      });

      Settings.embedModel = new OpenAIEmbedding({
        apiKey: process.env.OPENAI_API_KEY,
        model: 'text-embedding-3-small',
      });

      this._vectorStore = new PGVectorStore({
        clientConfig: {
          connectionString: process.env.DATABASE_URL,
        },
        tableName: 'project_embeddings',
        schemaName: 'public',
        dimensions: 1536, // text-embedding-3-small is 1536 by default
      });

      this._isInitialized = true;
      logger.info('RAG Service initialized with PGVectorStore');
    } catch (error) {
      logger.error('Failed to initialize RAG Service', error);
      throw error;
    }
  }

  async indexFiles(files: Record<string, string>): Promise<IndexResult> {
    await this._initialize();

    if (!this._vectorStore) {
      throw new Error('Vector store not initialized');
    }

    try {
      const documents = Object.entries(files).map(([path, content]) => {
        return new Document({
          text: content,
          metadata: { path },
        });
      });

      const storageContext = await storageContextFromDefaults({
        vectorStore: this._vectorStore,
      });

      await VectorStoreIndex.fromDocuments(documents, {
        storageContext,
      });

      logger.info(`Successfully indexed ${documents.length} files`);

      return { indexedCount: documents.length };
    } catch (error) {
      logger.error('Error during indexing', error);

      return { indexedCount: 0, error: String(error) };
    }
  }

  async query(query: string, topK: number = 5): Promise<string[]> {
    await this._initialize();

    if (!this._vectorStore) {
      throw new Error('Vector store not initialized');
    }

    try {
      const index = await VectorStoreIndex.fromVectorStore(this._vectorStore);
      const retriever = index.asRetriever({ similarityTopK: topK });

      const nodesWithScores = await retriever.retrieve({ query });

      return (nodesWithScores as NodeWithScore<Metadata>[]).map((result) => {
        const node = result.node as BaseNode;
        const path = node.metadata.path;
        const content = node.getContent(MetadataMode.NONE);

        return `File: ${path}\n---\n${content}\n---`;
      });
    } catch (error) {
      logger.error('Error during RAG query', error);

      return [];
    }
  }

  async clearIndex() {
    await this._initialize();

    /**
     * Manual cleanup of the table if needed
     */
    const client = new PG_CLIENT({
      connectionString: process.env.DATABASE_URL,
    });

    try {
      await client.connect();
      await client.query('DROP TABLE IF EXISTS project_embeddings');
      this._isInitialized = false;
      await this._initialize();
      logger.info('Index cleared');
    } catch (error) {
      logger.error('Error clearing index', error);
    } finally {
      await client.end();
    }
  }
}
