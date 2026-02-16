interface MetricEntry {
  name: string;
  value: number;
  labels: Record<string, string>;
  timestamp: number;
}

/**
 * Observability Subsystem: Application Metrics Collection
 * Aggregates runtime metrics for performance monitoring (Prometheus-ready).
 */
export class MetricsCollector {
  private static _instance: MetricsCollector;
  private _metrics: MetricEntry[] = [];

  private constructor() {
    // Singleton
  }

  static getInstance(): MetricsCollector {
    if (!MetricsCollector._instance) {
      MetricsCollector._instance = new MetricsCollector();
    }

    return MetricsCollector._instance;
  }

  /**
   * Records a counter metric (e.g., request_count).
   */
  increment(name: string, labels: Record<string, string> = {}) {
    this._addMetric(name, 1, labels);
  }

  /**
   * Records a gauge metric (e.g., memory_usage).
   */
  setGauge(name: string, value: number, labels: Record<string, string> = {}) {
    this._addMetric(name, value, labels);
  }

  /**
   * Exports metrics in Prometheus text format.
   */
  exportPrometheus(): string {
    const lines: string[] = [];
    const grouped = this._groupMetrics();

    for (const [name, entries] of Object.entries(grouped)) {
      lines.push(`# HELP ${name} Application metric ${name}`);
      lines.push(`# TYPE ${name} counter`); // Defaulting to counter for simplicity

      for (const entry of entries) {
        const labelsStr = Object.entries(entry.labels)
          .map(([k, v]) => `${k}="${v}"`)
          .join(',');
        lines.push(`${name}{${labelsStr}} ${entry.value}`);
      }
    }

    return lines.join('\n');
  }

  private _addMetric(name: string, value: number, labels: Record<string, string>) {
    this._metrics.push({
      name,
      value,
      labels,
      timestamp: Date.now(),
    });

    // Simple retention: keep last 1000 metrics
    if (this._metrics.length > 1000) {
      this._metrics.shift();
    }
  }

  private _groupMetrics(): Record<string, MetricEntry[]> {
    return this._metrics.reduce(
      (acc, entry) => {
        if (!acc[entry.name]) {
          acc[entry.name] = [];
        }

        acc[entry.name].push(entry);

        return acc;
      },
      {} as Record<string, MetricEntry[]>,
    );
  }
}

export const metricsCollector = MetricsCollector.getInstance();
