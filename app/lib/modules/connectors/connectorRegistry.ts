import { BaseConnector } from './baseConnector';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('ConnectorRegistry');

/**
 * Connector Subsystem: Centralized Connector Registry
 * Manages all registered external API connectors.
 */
export class ConnectorRegistry {
  private static _instance: ConnectorRegistry;
  private _connectors: Map<string, BaseConnector> = new Map();

  private constructor() {}

  static getInstance(): ConnectorRegistry {
    if (!ConnectorRegistry._instance) {
      ConnectorRegistry._instance = new ConnectorRegistry();
    }
    return ConnectorRegistry._instance;
  }

  /**
   * Registers a connector in the registry.
   */
  register(name: string, connector: BaseConnector) {
    this._connectors.set(name.toLowerCase(), connector);
    logger.info(`Connector registered: ${name}`);
  }

  /**
   * Retrieves a connector by name.
   */
  getConnector<T extends BaseConnector>(name: string): T {
    const connector = this._connectors.get(name.toLowerCase());
    if (!connector) {
      throw new Error(`Connector '${name}' not found in registry.`);
    }
    return connector as T;
  }

  /**
   * Lists all registered connector names.
   */
  listConnectors(): string[] {
    return Array.from(this._connectors.keys());
  }
}

export const connectorRegistry = ConnectorRegistry.getInstance();
