import { createScopedLogger } from '~/utils/logger';
import { logRedactor } from '~/lib/modules/security/redactor';
import { metricsCollector } from './metricsCollector';

const logger = createScopedLogger('Diagnostics');

/**
 * Observability Subsystem: Support Bundle Generator
 * Collects system info, logs, and state into a zip/json for support & debugging.
 */
export class DiagnosticsService {
  private static _instance: DiagnosticsService;

  private constructor() {
    // Singleton
  }

  static getInstance(): DiagnosticsService {
    if (!DiagnosticsService._instance) {
      DiagnosticsService._instance = new DiagnosticsService();
    }

    return DiagnosticsService._instance;
  }

  /**
   * Generates a comprehensive support bundle.
   */
  async generateSupportBundle(): Promise<string> {
    logger.info('Generating support bundle...');

    const bundle = {
      timestamp: new Date().toISOString(),
      systemInfo: {
        platform: process.platform,
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
      },
      metrics: metricsCollector.exportPrometheus(),
      config: this._getSanitizedConfig(),

      // In production, we would add log files here
      logs: ['Recent log entries would be collected here...'],
    };

    // Redact everything before returning/saving
    return JSON.stringify(logRedactor.redactObject(bundle), null, 2);
  }

  private _getSanitizedConfig(): Record<string, any> {
    // Collect non-sensitive app config
    return {
      nodeEnv: process.env.NODE_ENV,
      viteDev: !!process.env.VITE_DEV,

      // Avoid raw process.env
    };
  }
}

export const diagnosticsService = DiagnosticsService.getInstance();
