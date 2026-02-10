import { describe, it, expect } from 'vitest';
import { chatRequestSchema, enhancerRequestSchema, bugReportSchema, checkEnvKeySchema } from './api-validation';

describe('API Validation Schemas', () => {
  describe('chatRequestSchema', () => {
    it('should accept valid chat request', () => {
      const valid = {
        messages: [{ role: 'user', content: 'Hello' }],
        contextOptimization: false,
        chatMode: 'build',
        maxLLMSteps: 3,
      };

      const result = chatRequestSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject empty messages array', () => {
      const invalid = {
        messages: [],
        chatMode: 'build',
        maxLLMSteps: 3,
      };

      const result = chatRequestSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject invalid role', () => {
      const invalid = {
        messages: [{ role: 'hacker', content: 'test' }],
        chatMode: 'build',
        maxLLMSteps: 3,
      };

      const result = chatRequestSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject maxLLMSteps over 50', () => {
      const invalid = {
        messages: [{ role: 'user', content: 'test' }],
        chatMode: 'build',
        maxLLMSteps: 100,
      };

      const result = chatRequestSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should default optional fields', () => {
      const minimal = {
        messages: [{ role: 'user', content: 'test' }],
      };

      const result = chatRequestSchema.safeParse(minimal);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.chatMode).toBe('build');
        expect(result.data.contextOptimization).toBe(false);
        expect(result.data.maxLLMSteps).toBe(3);
      }
    });
  });

  describe('enhancerRequestSchema', () => {
    it('should accept valid enhancer request', () => {
      const valid = { message: 'Build me a todo app' };
      const result = enhancerRequestSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject empty message', () => {
      const invalid = { message: '' };
      const result = enhancerRequestSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject message over 10000 chars', () => {
      const invalid = { message: 'a'.repeat(10001) };
      const result = enhancerRequestSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('bugReportSchema', () => {
    it('should accept valid bug report', () => {
      const valid = {
        title: 'App crashes on load',
        description: 'When I open the app, it crashes immediately',
      };
      const result = bugReportSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject missing title', () => {
      const invalid = { description: 'Some description' };
      const result = bugReportSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject overly long title', () => {
      const invalid = {
        title: 'a'.repeat(201),
        description: 'Some description',
      };
      const result = bugReportSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('checkEnvKeySchema', () => {
    it('should accept valid key check', () => {
      const valid = { key: 'OPENAI_API_KEY', provider: 'openai' };
      const result = checkEnvKeySchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject empty key', () => {
      const invalid = { key: '', provider: 'openai' };
      const result = checkEnvKeySchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});
