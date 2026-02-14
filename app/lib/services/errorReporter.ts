import { RuntimeConfig } from '~/lib/runtime/config';
import { logStore } from '~/lib/stores/logs';

/**
 * Centralized service for reporting client-side errors.
 * Can be extended to send errors to Sentry, LogRocket, etc.
 */

type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info';

interface ErrorReport {
  message: string;
  stack?: string;
  source?: string; // 'react-boundary', 'window.onerror', 'promise', etc.
  severity: ErrorSeverity;
  metadata?: Record<string, any>;
  timestamp: number;
}

class ErrorReporterService {
  private static instance: ErrorReporterService;
  private initialized = false;

  private constructor() {}

  public static getInstance(): ErrorReporterService {
    if (!ErrorReporterService.instance) {
      ErrorReporterService.instance = new ErrorReporterService();
    }
    return ErrorReporterService.instance;
  }

  /**
   * Initialize global error handlers
   */
  public init() {
    if (this.initialized || RuntimeConfig.isServer) return;

    window.addEventListener('error', (event) => {
      this.report({
        message: event.message,
        stack: event.error?.stack,
        source: 'window.onerror',
        severity: 'error',
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.report({
        message: `Unhandled Promise Rejection: ${event.reason}`, // Use 'reason' not 'message'
        source: 'unhandledrejection',
        severity: 'error',
        metadata: { reason: event.reason },
      });
    });

    this.initialized = true;
    console.log('[ErrorReporter] Initialized');
  }

  /**
   * Report an error
   */
  public report(error: Error | string | Partial<ErrorReport>) {
    const report: ErrorReport = {
      timestamp: Date.now(),
      severity: 'error',
      message: 'Unknown error',
      ...this.normalizeError(error),
    };

    // 1. Log to console in specific environments
    if (RuntimeConfig.isDevelopment) {
      console.groupCollapsed(`[ErrorReporter] ${report.severity.toUpperCase()}: ${report.message}`);
      console.log('Source:', report.source);
      console.log('Stack:', report.stack);
      console.log('Metadata:', report.metadata);
      console.groupEnd();
    }

    // 2. Log to internal LogStore (visible in debugging UI)
    try {
        logStore.logError(`[${report.source || 'Manual'}] ${report.message}`, new Error(report.message));
        // Note: logStore expects an Error object. We preserve the original if possible, but creating a new one works for now.
        // Ideally logStore should accept a robust object.
    } catch {
        // failed to log
    }

    // 3. (Future) Send to external service (Sentry, etc.)
    // if (RuntimeConfig.isProduction) {
    //   Sentry.captureException(...)
    // }
  }

  private normalizeError(error: Error | string | Partial<ErrorReport>): Partial<ErrorReport> {
    if (typeof error === 'string') {
      return { message: error };
    }

    if (error instanceof Error) {
      return {
        message: error.message,
        stack: error.stack,
      };
    }

    return error;
  }
}

export const errorReporter = ErrorReporterService.getInstance();
