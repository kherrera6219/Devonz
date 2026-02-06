/**
 * Error Handling Utilities for Multi-Agent System
 *
 * Provides robust error handling, circuit breaker pattern, and graceful degradation.
 */

import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('AgentErrorHandler');

// Circuit breaker state
interface CircuitState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
}

const circuits: Map<string, CircuitState> = new Map();

// Circuit breaker config
const FAILURE_THRESHOLD = 3;
const RESET_TIMEOUT_MS = 60000; // 1 minute

/**
 * Circuit Breaker Pattern
 * Prevents repeated calls to failing services
 */
export function withCircuitBreaker<T>(name: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  const circuit = circuits.get(name) || { failures: 0, lastFailure: 0, isOpen: false };

  // Check if circuit should be reset
  if (circuit.isOpen && Date.now() - circuit.lastFailure > RESET_TIMEOUT_MS) {
    circuit.isOpen = false;
    circuit.failures = 0;
    logger.info(`Circuit ${name} reset`);
  }

  // If circuit is open, return fallback
  if (circuit.isOpen) {
    logger.warn(`Circuit ${name} is open, returning fallback`);

    return Promise.resolve(fallback);
  }

  return fn()
    .then((result) => {
      // Success - reset failures
      circuit.failures = 0;
      circuits.set(name, circuit);

      return result;
    })
    .catch((error) => {
      // Failure - increment counter
      circuit.failures++;
      circuit.lastFailure = Date.now();

      if (circuit.failures >= FAILURE_THRESHOLD) {
        circuit.isOpen = true;
        logger.error(`Circuit ${name} opened after ${FAILURE_THRESHOLD} failures`);
      }

      circuits.set(name, circuit);
      logger.error(`Circuit ${name} failure (${circuit.failures}/${FAILURE_THRESHOLD}):`, error);

      return fallback;
    });
}

/**
 * Retry with exponential backoff
 */
export async function withRetry<T>(fn: () => Promise<T>, maxRetries: number = 3, baseDelay: number = 1000): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      if (attempt < maxRetries) {
        const delay = baseDelay * 2 ** attempt;
        logger.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Safe wrapper for agent node execution
 * Catches errors and returns a safe state update
 */
export async function safeNodeExecution<T>(nodeName: string, fn: () => Promise<T>, fallback: Partial<T>): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    logger.error(`Node ${nodeName} failed:`, error);

    return {
      ...fallback,
      error: {
        node: nodeName,
        message: error.message,
        timestamp: Date.now(),
      },
    } as T;
  }
}

/**
 * Timeout wrapper for long-running operations
 */
export function withTimeout<T>(fn: () => Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((resolve) =>
      setTimeout(() => {
        logger.warn(`Operation timed out after ${timeoutMs}ms`);
        resolve(fallback);
      }, timeoutMs),
    ),
  ]);
}

/**
 * Input validation for agent state
 */
export function validateAgentState(state: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!state) {
    errors.push('State is null or undefined');

    return { valid: false, errors };
  }

  if (typeof state.userRequest !== 'string' && state.userRequest !== undefined) {
    errors.push('userRequest must be a string');
  }

  if (state.apiKeys && typeof state.apiKeys !== 'object') {
    errors.push('apiKeys must be an object');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize user input to prevent injection
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove potential script injections
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
    .slice(0, 10000); // Limit length
}

/**
 * Log and report agent errors for debugging
 */
export function reportAgentError(nodeName: string, error: any, context?: any): void {
  const errorReport = {
    node: nodeName,
    message: error.message || String(error),
    stack: error.stack,
    timestamp: new Date().toISOString(),
    context: context ? JSON.stringify(context).slice(0, 500) : undefined,
  };

  logger.error('Agent Error Report:', errorReport);

  // Could extend to send to external monitoring (Sentry, etc.)
}
