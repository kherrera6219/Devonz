
import { describe, it, expect } from 'vitest';
import { validateApiKeyFormat, sanitizeErrorMessage } from './security';

describe('Security Utils Module', () => {
  describe('validateApiKeyFormat', () => {
    it('should reject empty strings', () => {
      expect(validateApiKeyFormat('', 'openai')).toBe(false);
    });

    it('should reject placeholder values', () => {
      expect(validateApiKeyFormat('your_api_key_here', 'openai')).toBe(false);
    });

    it('should reject too-short keys', () => {
      expect(validateApiKeyFormat('short', 'openai')).toBe(false);
    });

    it('should accept valid-length keys', () => {
      const validKey = 'sk-' + 'a'.repeat(50);
      expect(validateApiKeyFormat(validKey, 'openai')).toBe(true);
    });
  });

  describe('sanitizeErrorMessage', () => {
    it('should show full error in development', () => {
      const error = new Error('Detailed API key error');
      expect(sanitizeErrorMessage(error, true)).toBe('Detailed API key error');
    });

    it('should hide API key errors in production', () => {
      const error = new Error('Invalid API key provided');
      expect(sanitizeErrorMessage(error, false)).toBe('Authentication failed');
    });

    it('should show rate limit message in production', () => {
      const error = new Error('rate limit exceeded');
      expect(sanitizeErrorMessage(error, false)).toBe('Rate limit exceeded. Please try again later.');
    });

    it('should show generic message for other errors in production', () => {
      const error = new Error('Some internal error');
      expect(sanitizeErrorMessage(error, false)).toBe('An unexpected error occurred');
    });
  });
});
