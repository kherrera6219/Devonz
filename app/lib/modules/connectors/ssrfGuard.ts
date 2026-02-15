import { createScopedLogger } from '~/utils/logger';
import { isIP } from 'node:net';

const logger = createScopedLogger('SSRFGuard');

/**
 * Connector Subsystem: SSRF Protection Layer
 * Blocks outgoing requests to internal or private IP ranges.
 */
export class SSRFGuard {
  private static _instance: SSRFGuard;

  // Private IP ranges (RFC 1918, etc.)
  private readonly _blockedRanges = [
    /^127\./, // Loopback
    /^10\./, // Private Class A
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Private Class B
    /^192\.168\./, // Private Class C
    /^169\.254\./, // Link-local
    /^::1$/, // IPv6 Loopback
    /^fe80:/, // IPv6 Link-local
    /^fc00:/, // IPv6 Unique Local
  ];

  private constructor() {}

  static getInstance(): SSRFGuard {
    if (!SSRFGuard._instance) {
      SSRFGuard._instance = new SSRFGuard();
    }

    return SSRFGuard._instance;
  }

  /**
   * Validates a URL to ensure it doesn't resolve to a protected internal address.
   * Note: In production, this should also perform DNS resolution before fetching.
   */
  async validateUrl(url: string): Promise<boolean> {
    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname;

      // 1. Direct IP check
      if (isIP(hostname)) {
        if (this._isInternalIP(hostname)) {
          logger.error(`SSRF Blocked: Attempted request to internal IP ${hostname}`);
          return false;
        }
      }

      // 2. Hostname check (common local names)
      const localNames = ['localhost', 'local', 'internal', 'development'];

      if (localNames.some((name) => hostname.toLowerCase().includes(name))) {
        logger.warn(`SSRF Warning: Potential local hostname detected: ${hostname}`);

        /*
         * We might choose to block or just warn depending on strictness
         * For now, we block strict localhost
         */
        if (hostname.toLowerCase() === 'localhost') {
          return false;
        }
      }

      return true;
    } catch (error) {
      logger.error('SSRF validation failed', error);
      return false;
    }
  }

  private _isInternalIP(ip: string): boolean {
    return this._blockedRanges.some((pattern) => pattern.test(ip));
  }
}

export const ssrfGuard = SSRFGuard.getInstance();
