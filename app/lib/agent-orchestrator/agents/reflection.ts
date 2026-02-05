/**
 * Reflection Agent
 *
 * Self-critique and improvement agent for the multi-agent system.
 * Reviews generated outputs and provides actionable feedback for improvement.
 */

import { ChatOpenAI } from '@langchain/openai';
import type { BoltState } from '../state/types';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('ReflectionAgent');

export class ReflectionAgent {
  private model: ChatOpenAI | null = null;

  private ensureModel(state: BoltState): void {
    if (this.model) return;

    const apiKey = state.apiKeys?.OPENAI_API_KEY || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OpenAI API key not found for ReflectionAgent');
    }

    this.model = new ChatOpenAI({
      modelName: 'gpt-4o-mini', // Cost-effective for reflection
      openAIApiKey: apiKey,
      maxTokens: 2048,
    });
  }

  /**
   * Reflect on generated code and provide improvement suggestions
   */
  async reflectOnCode(state: BoltState): Promise<Partial<BoltState>> {
    logger.info('Reflecting on generated code...');

    try {
      this.ensureModel(state);

      if (!state.generatedArtifacts?.files?.length) {
        return {
          reflectionFeedback: 'No code generated to reflect on.',
        };
      }

      const codeSnippets = state.generatedArtifacts.files
        .slice(0, 3) // Limit to first 3 files
        .map((f) => `### ${f.path}\n\`\`\`\n${f.content?.slice(0, 1500) || ''}\n\`\`\``)
        .join('\n\n');

      const prompt = `You are a code review expert. Review the following generated code and provide specific, actionable feedback.

## Context
User Request: ${state.userRequest || 'Not provided'}

## Generated Code
${codeSnippets}

## QC Findings
${JSON.stringify(state.qcFindings || [], null, 2)}

## Your Task
Provide a concise critique with:
1. **Critical Issues** (must fix)
2. **Improvements** (should fix)
3. **Quality Score** (1-10)

Be specific and actionable. Focus on correctness, security, and maintainability.`;

      const response = await this.model!.invoke(prompt);
      const feedback = response.content.toString();

      logger.info('Reflection complete');

      return {
        reflectionFeedback: feedback,
        reflectionScore: this.extractScore(feedback),
      };
    } catch (error: any) {
      logger.error('Reflection failed:', error);

      return {
        reflectionFeedback: `Reflection failed: ${error.message}`,
        reflectionScore: 0,
      };
    }
  }

  /**
   * Reflect on the overall plan before execution
   */
  async reflectOnPlan(state: BoltState): Promise<Partial<BoltState>> {
    logger.info('Reflecting on execution plan...');

    try {
      this.ensureModel(state);

      const prompt = `You are a planning expert. Review this plan for potential issues.

## User Request
${state.userRequest}

## Current Plan
${state.specifications ? JSON.stringify(state.specifications, null, 2) : 'No plan available'}

## Research Context
${state.researchFindings ? JSON.stringify(state.researchFindings, null, 2) : 'None'}

## Your Task
1. Are there any missing steps?
2. Are there potential blockers?
3. Is the approach optimal?
4. Rate the plan (1-10)

Be concise and actionable.`;

      const response = await this.model!.invoke(prompt);

      return {
        planReflection: response.content.toString(),
      };
    } catch (error: any) {
      logger.error('Plan reflection failed:', error);

      return {
        planReflection: `Plan reflection failed: ${error.message}`,
      };
    }
  }

  private extractScore(feedback: string): number {
    // Try to extract quality score from feedback
    const scoreMatch = feedback.match(/(?:quality\s*score|score)[:\s]*(\d+)/i);

    if (scoreMatch) {
      return Math.min(10, Math.max(1, parseInt(scoreMatch[1], 10)));
    }

    return 5; // Default score
  }
}
