import type { ModelInfo } from '../types';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('RoutingEngine');

export type RoutingPolicy = 'COST_OPTIMIZED' | 'SPEED_OPTIMIZED' | 'PRECISION_OPTIMIZED' | 'BALANCED';

interface RoutingRule {
  policy: RoutingPolicy;
  preferredModels: string[];
  fallbackModels: string[];
}

/**
 * AI Governance: Model Routing Policy Engine
 * Dynamically selects the best LLM based on performance, cost, and task requirements.
 */
export class ModelRoutingEngine {
  private static _instance: ModelRoutingEngine;

  private _rules: Record<RoutingPolicy, RoutingRule> = {
    COST_OPTIMIZED: {
      policy: 'COST_OPTIMIZED',
      preferredModels: ['gpt-4o-mini', 'claude-3-haiku', 'gemini-1.5-flash'],
      fallbackModels: ['gpt-4o'],
    },
    SPEED_OPTIMIZED: {
      policy: 'SPEED_OPTIMIZED',
      preferredModels: ['gpt-4o-mini', 'groq-llama-3-70b'],
      fallbackModels: ['gpt-4o'],
    },
    PRECISION_OPTIMIZED: {
      policy: 'PRECISION_OPTIMIZED',
      preferredModels: ['gpt-4o', 'claude-3-5-sonnet', 'gpt-4-turbo'],
      fallbackModels: ['claude-3-opus'],
    },
    BALANCED: {
      policy: 'BALANCED',
      preferredModels: ['gpt-4o', 'claude-3-5-sonnet'],
      fallbackModels: ['gpt-4o-mini'],
    },
  };

  private constructor() {}

  static getInstance(): ModelRoutingEngine {
    if (!ModelRoutingEngine._instance) {
      ModelRoutingEngine._instance = new ModelRoutingEngine();
    }
    return ModelRoutingEngine._instance;
  }

  /**
   * Selects an optimal model from the available list based on the requested policy.
   */
  selectModel(availableModels: ModelInfo[], policy: RoutingPolicy = 'BALANCED'): ModelInfo {
    const rule = this._rules[policy];

    // Try to find a preferred model that is available
    for (const modelName of rule.preferredModels) {
      const found = availableModels.find(m => m.name.toLowerCase().includes(modelName.toLowerCase()));
      if (found) {
        logger.info(`Routing: Selected preferred model '${found.name}' via ${policy} policy`);
        return found;
      }
    }

    // Try fallback models
    for (const modelName of rule.fallbackModels) {
      const found = availableModels.find(m => m.name.toLowerCase().includes(modelName.toLowerCase()));
      if (found) {
        logger.warn(`Routing: Fallback used! Selected '${found.name}' via ${policy} policy`);
        return found;
      }
    }

    // Default to the first available model if no matches
    logger.warn(`Routing: No policy match for ${policy}. Defaulting to first available model.`);
    return availableModels[0];
  }
}

export const modelRoutingEngine = ModelRoutingEngine.getInstance();
