import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('GuardrailService');

export interface GuardrailResult {
  passed: boolean;
  reason?: string;
  type?: 'injection' | 'moderation';
}

/**
 * AI Governance: Guardrail Layer
 * Protects against prompt injection and ensures content moderation.
 */
export class GuardrailService {
  private static _instance: GuardrailService;

  private readonly _injectionPatterns = [
    /ignore previous instructions/i,
    /system settings/i,
    /disregard/i,
    /new rules/i,
    /dan mode/i,
    /jailbreak/i,
    /bypass/i,
    /reveal system prompt/i,
  ];

  private constructor() {
    // Singleton
  }

  static getInstance(): GuardrailService {
    if (!GuardrailService._instance) {
      GuardrailService._instance = new GuardrailService();
    }

    return GuardrailService._instance;
  }

  /**
   * Scans input for prompt injection patterns.
   */
  async validateInput(text: string): Promise<GuardrailResult> {
    for (const pattern of this._injectionPatterns) {
      if (pattern.test(text)) {
        logger.warn(`Prompt injection detected: ${pattern}`);
        return {
          passed: false,
          reason: `Potential prompt injection detected (pattern match: ${pattern})`,
          type: 'injection',
        };
      }
    }

    return { passed: true };
  }

  /**
   * Moderates LLM output for safety and compliance.
   * In production, this would call a moderation API (e.g., OpenAI Moderation).
   * For now, it uses a basic keyword check.
   */
  async moderateOutput(text: string): Promise<GuardrailResult> {
    const forbiddenKeywords = ['harmful', 'offensive', 'illegal', 'toxic']; // Placeholder

    for (const word of forbiddenKeywords) {
      if (text.toLowerCase().includes(word)) {
        logger.warn(`Moderation failure: Content contains forbidden word '${word}'`);
        return {
          passed: false,
          reason: `Output contained forbidden content '${word}'`,
          type: 'moderation',
        };
      }
    }

    return { passed: true };
  }
}

export const guardrailService = GuardrailService.getInstance();
