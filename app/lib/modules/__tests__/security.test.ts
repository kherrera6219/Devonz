import { describe, it, expect } from 'vitest';
import { ssrfGuard } from '../connectors/ssrfGuard';
import { logRedactor } from '../security/redactor';

describe('Security Regression: SSRF Protection', () => {
  it('should block internal IP addresses', async () => {
    const internalIps = ['127.0.0.1', '192.168.1.1', '10.0.0.1', '169.254.169.254'];
    for (const ip of internalIps) {
      const isSafe = await ssrfGuard.validateUrl(`http://${ip}/metadata`);
      expect(isSafe).toBe(false);
    }
  });

  it('should allow public domain names', async () => {
    const publicUrls = ['https://github.com', 'https://api.openai.com', 'https://npm.js'];
    for (const url of publicUrls) {
      const isSafe = await ssrfGuard.validateUrl(url);
      expect(isSafe).toBe(true);
    }
  });

  it('should block localhost and local hostnames', async () => {
    const localNames = ['http://localhost:3000', 'http://dev.internal', 'http://database.local'];
    for (const name of localNames) {
      const isSafe = await ssrfGuard.validateUrl(name);
      expect(isSafe).toBe(false);
    }
  });
});

describe('Security Regression: Log Redaction', () => {
  it('should scrub API keys and secrets from strings', () => {
    const sensitiveLog = 'Error connecting with sk-1234567890abcdef and key=secret_val_hash';
    const redacted = logRedactor.redact(sensitiveLog);

    expect(redacted).not.toContain('sk-12345678');
    expect(redacted).toContain('[REDACTED:API Key]');
  });

  it('should scrub tokens from authorization headers', () => {
    const authHeader = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
    const redacted = logRedactor.redactObject({ auth: authHeader });

    expect(redacted.auth).toBe('[REDACTED]');
  });
});
