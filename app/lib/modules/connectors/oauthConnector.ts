import { BaseConnector } from './baseConnector';
import { z } from 'zod';

/**
 * Connector Subsystem: OAuth Connector Framework
 * Foundation for connectors requiring OAuth2 authentication.
 */
export abstract class OAuthConnector extends BaseConnector {
  protected _token: string | null = null;

  /**
   * Configures the connector with an OAuth token.
   */
  configure(token: string) {
    this._token = token;
  }

  /**
   * Specialized request method that injects OAuth headers.
   */
  protected async authenticatedRequest<T>(
    endpoint: string,
    schema: z.ZodType<T>,
    options: RequestInit = {}
  ): Promise<T> {
    if (!this._token) {
      throw new Error(`Authentication required for ${this.name} connector.`);
    }

    const authOptions: RequestInit = {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${this._token}`,
        'Accept': 'application/json',
      },
    };

    return this.request(endpoint, schema, authOptions);
  }
}
