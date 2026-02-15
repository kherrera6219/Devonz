import { createScopedLogger } from '~/utils/logger';
import { logAggregator } from './logAggregator';
import { diagnosticsService } from './diagnostics';

const logger = createScopedLogger('CrashReporter');

/**
 * Observability Subsystem: Crash Reporting System
 * Captures fatal errors and generates detailed reports for debugging.
 */
export class CrashReporter {
  private static _instance: CrashReporter;

  private constructor() {}

  static getInstance(): CrashReporter {
    if (!CrashReporter._instance) {
      CrashReporter._instance = new CrashReporter();
    }
    return CrashReporter._instance;
  }

  /**
   * Reports a crash with a support bundle and metadata.
   */
  async reportCrash(error: Error, metadata: Record<string, any> = {}) {
    logger.error('CRASH DETECTED:', error);

    const bundle = await diagnosticsService.generateSupportBundle();

    logAggregator.log({
      level: 'error',
      service: 'CrashReporter',
      message: `Fatal Crash: ${error.message}`,
      metadata: {
        ...metadata,
        stack: error.stack,
        diagnosticBundle: JSON.parse(bundle),
      },
    });

    // In production, send to external service (Sentry, etc.)
    logger.info('Crash report submitted to aggregator.');
  }

  /**
   * Hooks into global error handlers.
   */
  init() {
    if (typeof window !== 'undefined') {
       window.addEventListener('error', (event) => {
         this.reportCrash(event.error || new Error(event.message));
       });
    }
  }
}

export const crashReporter = CrashReporter.getInstance();
