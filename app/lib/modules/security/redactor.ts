import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('LogRedactor');

/**
 * Security Subsystem: Redaction Framework
 * Scrubs sensitive data (API keys, passwords, tokens) from logs and exports.
 */
export class LogRedactor {
  private static _instance: LogRedactor;

  private readonly _redactionPatterns = [
    { name: 'API Key', pattern: /[a-z0-9]{32,}/gi }, // Generic hex-like key
    { name: 'GitHub Token', pattern: /ghp_[a-zA-Z0-9]{36}/g },
    { name: 'OpenAI Key', pattern: /sk-[a-zA-Z0-9]{48}/g },
    { name: 'Anthropic Key', pattern: /sk-ant-sid01-[a-zA-Z0-9_-]{93}/g },
    { name: 'AWS Secret', pattern: /(?:AWS|aws|Aws).?[0-9a-zA-Z/+]{40}/g },
    { name: 'Password', pattern: /(?:password|passwd|pwd)\s*[:=]\s*["']?([^"'\s]+)["']?/gi },
  ];

  private constructor() {}

  static getInstance(): LogRedactor {
    if (!LogRedactor._instance) {
      LogRedactor._instance = new LogRedactor();
    }

    return LogRedactor._instance;
  }

  /**
   * Redacts sensitive information from a string.
   */
  redact(text: string): string {
    let redacted = text;

    for (const { name, pattern } of this._redactionPatterns) {
      redacted = redacted.replace(pattern, (match) => {
        logger.debug(`Redacted sensitive data: ${name}`);
        return `[REDACTED:${name}]`;
      });
    }

    return redacted;
  }

  /**
   * Redacts sensitive information from an object (recursively).
   */
  redactObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return typeof obj === 'string' ? this.redact(obj) : obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.redactObject(item));
    }

    const result: any = {};

    for (const [key, value] of Object.entries(obj)) {
      // Specifically redact common sensitive keys regardless of value pattern
      const sensitiveKeys = ['token', 'password', 'secret', 'key', 'apiKey', 'authorization'];

      if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk.toLowerCase()))) {
        result[key] = '[REDACTED]';
      } else {
        result[key] = this.redactObject(value);
      }
    }

    return result;
  }
}

export const logRedactor = LogRedactor.getInstance();
