import { redisService } from '~/lib/services/redisService';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('UsageMonitor');

interface UsageMetrics {
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  estimatedCost: number;
}

/**
 * AI Governance: Usage Tracking & Cost Monitoring
 * Tracks token consumption and enforces usage budgets.
 */
export class UsageMonitor {
  private static _instance: UsageMonitor;

  // Placeholder pricing (USD per 1M tokens)
  private readonly _pricing: Record<string, { prompt: number; completion: number }> = {
    'gpt-4o': { prompt: 5.0, completion: 15.0 },
    'gpt-4o-mini': { prompt: 0.15, completion: 0.6 },
    'claude-3-5-sonnet': { prompt: 3.0, completion: 15.0 },
    'claude-3-opus': { prompt: 15.0, completion: 75.0 },
    'default': { prompt: 1.0, completion: 2.0 },
  };

  private constructor() {}

  static getInstance(): UsageMonitor {
    if (!UsageMonitor._instance) {
      UsageMonitor._instance = new UsageMonitor();
    }
    return UsageMonitor._instance;
  }

  /**
   * Records usage for a given model and user.
   */
  async recordUsage(userId: string, modelId: string, usage: { promptTokens: number; completionTokens: number }) {
    const cost = this._calculateCost(modelId, usage);
    const key = `usage:user:${userId}`;
    const globalKey = 'usage:global';

    try {
      const current = await this.getUsage(userId);
      const newMetrics: UsageMetrics = {
        totalTokens: current.totalTokens + usage.promptTokens + usage.completionTokens,
        promptTokens: current.promptTokens + usage.promptTokens,
        completionTokens: current.completionTokens + usage.completionTokens,
        estimatedCost: current.estimatedCost + cost,
      };

      await redisService.set(key, JSON.stringify(newMetrics));

      // Update global usage
      const globalCurrent = await this.getGlobalUsage();
      await redisService.set(globalKey, JSON.stringify({
        totalTokens: globalCurrent.totalTokens + usage.promptTokens + usage.completionTokens,
        estimatedCost: globalCurrent.estimatedCost + cost,
      }));

      logger.info(`Usage recorded for user ${userId}: ${usage.promptTokens + usage.completionTokens} tokens, $${cost.toFixed(4)}`);
    } catch (error) {
      logger.error('Failed to record usage', error);
    }
  }

  /**
   * Checks if a user has exceeded their budget.
   */
  async isWithinBudget(userId: string, budgetLimit: number): Promise<boolean> {
    const usage = await this.getUsage(userId);
    return usage.estimatedCost < budgetLimit;
  }

  async getUsage(userId: string): Promise<UsageMetrics> {
    const data = await redisService.get(`usage:user:${userId}`);
    return data ? JSON.parse(data) : { totalTokens: 0, promptTokens: 0, completionTokens: 0, estimatedCost: 0 };
  }

  async getGlobalUsage(): Promise<{ totalTokens: number; estimatedCost: number }> {
    const data = await redisService.get('usage:global');
    return data ? JSON.parse(data) : { totalTokens: 0, estimatedCost: 0 };
  }

  private _calculateCost(modelId: string, usage: { promptTokens: number; completionTokens: number }): number {
    const price = this._pricing[modelId.toLowerCase()] || this._pricing.default;
    const promptCost = (usage.promptTokens / 1_000_000) * price.prompt;
    const completionCost = (usage.completionTokens / 1_000_000) * price.completion;
    return promptCost + completionCost;
  }
}

export const usageMonitor = UsageMonitor.getInstance();
