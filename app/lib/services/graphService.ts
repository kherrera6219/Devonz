import neo4j, { type Driver, type Session } from 'neo4j-driver';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('graph-service');

const NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'devonz_graph_password';

export interface GraphNode {
  id: string;
  label: string;
  properties: Record<string, any>;
}

export interface GraphRelationship {
  sourceId: string;
  targetId: string;
  type: string;
  properties: Record<string, any>;
}

export class GraphService {
  private static _instance: GraphService;
  private _driver: Driver;

  private constructor() {
    this._driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));
  }

  static getInstance(): GraphService {
    if (!GraphService._instance) {
      GraphService._instance = new GraphService();
    }
    return GraphService._instance;
  }

  private async _getSession(): Promise<Session> {
    return this._driver.session();
  }

  /**
   * Standardizes node labels to include the projectId for strict isolation
   */
  private _getProjectLabel(projectId: string): string {
    // Sanitized project label (Neo4j labels shouldn't have dashes, so we use underscores)
    return `Project_${projectId.replace(/-/g, '_')}`;
  }

  async addFileNode(projectId: string, path: string, metadata: Record<string, any> = {}) {
    const session = await this._getSession();
    const projectLabel = this._getProjectLabel(projectId);

    try {
      await session.executeWrite((tx) =>
        tx.run(
          `
          MERGE (f:File {path: $path, projectId: $projectId})
          SET f += $metadata
          WITH f
          CALL apoc.create.addLabels(f, [$projectLabel]) YIELD node
          return node
          `,
          { path, projectId, metadata, projectLabel }
        )
      );
    } catch (error) {
      logger.error(`Failed to add file node: ${path}`, error);
    } finally {
      await session.close();
    }
  }

  async addDependency(projectId: string, sourcePath: string, targetPath: string, type: string = 'IMPORTS') {
    const session = await this._getSession();

    try {
      await session.executeWrite((tx) =>
        tx.run(
          `
          MATCH (a:File {path: $sourcePath, projectId: $projectId})
          MATCH (b:File {path: $targetPath, projectId: $projectId})
          MERGE (a)-[r:DEPENDS_ON {type: $type, projectId: $projectId}]->(b)
          RETURN r
          `,
          { sourcePath, targetPath, projectId, type }
        )
      );
    } catch (error) {
      logger.error(`Failed to add dependency: ${sourcePath} -> ${targetPath}`, error);
    } finally {
      await session.close();
    }
  }

  async getProjectSubgraph(projectId: string, limit: number = 100) {
    const session = await this._getSession();
    const projectLabel = this._getProjectLabel(projectId);

    try {
      const result = await session.executeRead((tx) =>
        tx.run(
          `
          MATCH (n:${projectLabel})-[r]->(m:${projectLabel})
          RETURN n, r, m LIMIT $limit
          `,
          { limit: neo4j.int(limit) }
        )
      );

      return result.records.map((record) => ({
        source: record.get('n').properties as Record<string, any>,
        relationship: record.get('r').type as string,
        target: record.get('m').properties as Record<string, any>,
      }));
    } catch (error) {
      logger.error(`Failed to get subgraph for project: ${projectId}`, error);
      return [];
    } finally {
      await session.close();
    }
  }

  async close() {
    await this._driver.close();
  }
}

export const graphService = GraphService.getInstance();
