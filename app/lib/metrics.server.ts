/**
 * Prometheus Metrics Service
 *
 * Provides metrics collection for the backend using prom-client.
 * Includes a NOOP shim if prom-client is not available to prevent build/runtime failures.
 */

let client: any;

try {
  // Use a string variable to prevent Vite from attempting to resolve the import at build time
  const moduleName = 'prom-client';
  client = await import(moduleName);
} catch (e) {
  // NOOP Shim if prom-client is missing
  client = {
    Registry: class {
      setDefaultLabels() {}
    },
    Histogram: class {
      labels() {
        return { observe() {} };
      }
    },
    Counter: class {
      labels() {
        return { inc() {} };
      }
    },
    collectDefaultMetrics() {},
  };
}

// Create a Registry which registers the metrics
export const register = new client.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels?.({
  app: 'devonz',
});

// Enable the collection of default metrics
try {
  client.collectDefaultMetrics({ register });
} catch (e) {}

// Create custom metrics
export const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  registers: [register],
});

export const llmRequestCounter = new client.Counter({
  name: 'llm_requests_total',
  help: 'Total number of LLM requests',
  labelNames: ['provider', 'model', 'status'],
  registers: [register],
});
