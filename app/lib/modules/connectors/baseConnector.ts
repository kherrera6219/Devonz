import { z } from 'zod';
import { ssrfGuard } from './ssrfGuard';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('BaseConnector');

export interface ConnectorRequestOptions extends RequestInit {
  validateSrf?: boolean;
}

/**
 * Connector Subsystem: Base Connector Framework
 * Provides foundation for all external API integrations with validation and security.
 */
export abstract class BaseConnector {
  protected abstract readonly name: string;
  protected abstract readonly baseUrl: string;

  /**
   * Performs a secure validated fetch request.
   */
  protected async request<T>(
    endpoint: string,
    schema: z.ZodType<T>,
    options: ConnectorRequestOptions = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    // 1. SSRF Check
    if (options.validateSrf !== false) {
      const isSafe = await ssrfGuard.validateUrl(url);
      if (!isSafe) {
        throw new Error(`Security Block: SSRF protection triggered for ${url}`);
      }
    }

    logger.debug(`[${this.name}] Requesting ${url}`);

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`[${this.name}] Request failed: ${response.status} ${errorText}`);
        throw new Error(`Channel Error (${this.name}): ${response.statusText}`);
      }

      const data = await response.json();

      // 2. API Contract Validation (Zod)
      const validation = schema.safeParse(data);

      if (!validation.success) {
        logger.error(`[${this.name}] Contract Validation Failure:`, validation.error.format());
        throw new Error(`Data Contract Violation in ${this.name} response.`);
      }

      return validation.data;
    } catch (error) {
      logger.error(`[${this.name}] Request exception:`, error);
      throw error;
    }
  }

  /**
   * Standard error sanitizer for connectors.
   */
  protected handleError(error: any): never {
    // Redact sensitive info if needed
    throw error;
  }
}
