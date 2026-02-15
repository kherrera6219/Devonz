import { createScopedLogger } from '~/utils/logger';
import { logRedactor } from '~/lib/modules/security/redactor';

const logger = createScopedLogger('LogAggregator');

export interface StructuredLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  service: string;
  message: string;
  metadata?: Record<string, any>;
}

/**
 * Observability Subsystem: Structured Log Aggregation
 * Standardizes log format (JSON) for production monitoring and analysis.
 */
export class LogAggregator {
  private static _instance: LogAggregator;

  private constructor() {}

  static getInstance(): LogAggregator {
    if (!LogAggregator._instance) {
      LogAggregator._instance = new LogAggregator();
    }

    return LogAggregator._instance;
  }

  /**
   * Emits a structured log entry.
   */
  log(entry: Omit<StructuredLog, 'timestamp'>) {
    const structured: StructuredLog = {
      timestamp: new Date().toISOString(),
      ...entry,
    };

    // Redact sensitive data before emitting
    const redacted = logRedactor.redactObject(structured);

    // In production, this would be written to a stream or file
    console.log(JSON.stringify(redacted));
  }
}

export const logAggregator = LogAggregator.getInstance();
