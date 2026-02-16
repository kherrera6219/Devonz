import { metricsCollector } from './metricsCollector';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('LatencyMonitor');

/**
 * Observability Subsystem: AI & Connector Latency Monitoring
 * Measures and records real-time performance of external service calls.
 */
export class LatencyMonitor {
  private static _instance: LatencyMonitor;

  private constructor() {
    // Singleton
  }

  static getInstance(): LatencyMonitor {
    if (!LatencyMonitor._instance) {
      LatencyMonitor._instance = new LatencyMonitor();
    }

    return LatencyMonitor._instance;
  }

  /**
   * Starts timing a request. Returns a function to call when the request is done.
   */
  startTimer(serviceName: string, operation: string): () => void {
    const start = performance.now();
    logger.debug(`Latency started for ${serviceName}:${operation}`);

    return () => {
      const duration = performance.now() - start;
      logger.debug(`Latency for ${serviceName}:${operation}: ${duration.toFixed(2)}ms`);

      metricsCollector.setGauge('service_latency_ms', duration, {
        service: serviceName,
        operation,
      });

      if (duration > 2000) {
        logger.warn(`High Latency Detected: ${serviceName}:${operation} took ${duration.toFixed(0)}ms`);
      }
    };
  }

  /**
   * Utility for measuring an async function.
   */
  async measure<T>(serviceName: string, operation: string, fn: () => Promise<T>): Promise<T> {
    const stop = this.startTimer(serviceName, operation);

    try {
      return await fn();
    } finally {
      stop();
    }
  }
}

export const latencyMonitor = LatencyMonitor.getInstance();
