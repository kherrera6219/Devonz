/**
 * MCP Security Tools
 *
 * Tools for security scanning: npm audit, semgrep, secret detection.
 * All tools return structured output for QC pipeline consumption.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { SecAuditResult, SecScanResult, SecSecretsResult } from '~/lib/mcp/types';

const execAsync = promisify(exec);

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_CWD = process.cwd();
const COMMAND_TIMEOUT = 60000;

// Common secret patterns (for basic detection)
const SECRET_PATTERNS = [
  { type: 'API_KEY', pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*["']?([a-zA-Z0-9_-]{20,})["']?/gi },
  { type: 'AWS_KEY', pattern: /AKIA[0-9A-Z]{16}/g },
  { type: 'JWT', pattern: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g },
  { type: 'PRIVATE_KEY', pattern: /-----BEGIN (?:RSA |EC |DSA )?PRIVATE KEY-----/g },
  { type: 'PASSWORD', pattern: /(?:password|passwd|pwd)\s*[:=]\s*["']([^"']+)["']/gi },
  { type: 'SECRET', pattern: /(?:secret|token)\s*[:=]\s*["']([a-zA-Z0-9_-]{16,})["']/gi },
];

// Files to skip during secret scanning
const SKIP_FILES = [
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  '.git',
  'node_modules',
  '.env.example',
  '.env.template',
];

// ═══════════════════════════════════════════════════════════════════════════
// NPM AUDIT
// ═══════════════════════════════════════════════════════════════════════════

interface NpmAuditArgs {
  cwd?: string;
}

export async function npmAudit(args: NpmAuditArgs): Promise<SecAuditResult> {
  const cwd = args.cwd || DEFAULT_CWD;

  try {
    // npm audit returns non-zero exit code if vulnerabilities found
    const { stdout } = await execAsync('npm audit --json', {
      cwd,
      timeout: COMMAND_TIMEOUT,
    });

    return parseNpmAuditOutput(stdout);
  } catch (error: any) {
    // npm audit returns exit code 1 if vulnerabilities found
    if (error.stdout) {
      return parseNpmAuditOutput(error.stdout);
    }

    return {
      vulnerabilities: [],
      metadata: {
        totalDependencies: 0,
        vulnerableCount: 0,
      },
    };
  }
}

function parseNpmAuditOutput(output: string): SecAuditResult {
  try {
    const data = JSON.parse(output);
    const vulnerabilities: SecAuditResult['vulnerabilities'] = [];

    // Handle npm audit v2 format
    if (data.vulnerabilities) {
      for (const [name, details] of Object.entries(data.vulnerabilities as Record<string, any>)) {
        for (const via of details.via || []) {
          if (typeof via === 'object') {
            vulnerabilities.push({
              id: via.source?.toString() || `vuln-${name}`,
              package: name,
              version: details.range || 'unknown',
              severity: via.severity || 'moderate',
              title: via.title || 'Unknown vulnerability',
              url: via.url,
              fixAvailable: details.fixAvailable || false,
              fixVersion: details.fixAvailable?.version,
            });
          }
        }
      }
    }

    return {
      vulnerabilities,
      metadata: {
        totalDependencies: data.metadata?.dependencies?.total || 0,
        vulnerableCount: vulnerabilities.length,
      },
    };
  } catch {
    return {
      vulnerabilities: [],
      metadata: { totalDependencies: 0, vulnerableCount: 0 },
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SEMGREP SCAN
// ═══════════════════════════════════════════════════════════════════════════

interface SemgrepArgs {
  cwd?: string;
  rules?: string;
}

export async function semgrepScan(args: SemgrepArgs): Promise<SecScanResult> {
  const cwd = args.cwd || DEFAULT_CWD;
  const rules = args.rules || 'p/default';

  try {
    const { stdout } = await execAsync(`npx @semgrep/semgrep --config ${rules} --json ${cwd}`, {
      cwd,
      timeout: COMMAND_TIMEOUT * 2,
    });

    return parseSemgrepOutput(stdout);
  } catch (error: any) {
    // Semgrep may not be installed - return empty result
    if (error.message?.includes('not found') || error.message?.includes('ENOENT')) {
      return {
        findings: [],
        scannedFiles: 0,
      };
    }

    // Try to parse partial output
    if (error.stdout) {
      return parseSemgrepOutput(error.stdout);
    }

    return {
      findings: [],
      scannedFiles: 0,
    };
  }
}

function parseSemgrepOutput(output: string): SecScanResult {
  try {
    const data = JSON.parse(output);
    const findings: SecScanResult['findings'] = [];

    for (const result of data.results || []) {
      findings.push({
        id: result.check_id || 'unknown',
        rule: result.check_id || 'unknown',
        severity: mapSemgrepSeverity(result.extra?.severity || 'INFO'),
        file: result.path || 'unknown',
        line: result.start?.line || 0,
        message: result.extra?.message || 'Security issue detected',
        category: result.extra?.metadata?.category || 'security',
      });
    }

    return {
      findings,
      scannedFiles: data.paths?.scanned?.length || 0,
    };
  } catch {
    return {
      findings: [],
      scannedFiles: 0,
    };
  }
}

function mapSemgrepSeverity(severity: string): 'info' | 'warning' | 'error' {
  switch (severity.toLowerCase()) {
    case 'error':
    case 'high':
    case 'critical':
      return 'error';
    case 'warning':
    case 'medium':
      return 'warning';
    default:
      return 'info';
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SECRET SCAN
// ═══════════════════════════════════════════════════════════════════════════

interface SecretScanArgs {
  cwd?: string;
  maxFiles?: number;
}

export async function secretScan(args: SecretScanArgs): Promise<SecSecretsResult> {
  const cwd = args.cwd || DEFAULT_CWD;
  const maxFiles = args.maxFiles || 500;

  const secrets: SecSecretsResult['secrets'] = [];
  let filesScanned = 0;

  async function scanDir(dir: string): Promise<void> {
    if (filesScanned >= maxFiles) {
      return;
    }

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (filesScanned >= maxFiles) {
          break;
        }

        const fullPath = path.join(dir, entry.name);

        // Skip ignored paths
        if (SKIP_FILES.some((skip) => fullPath.includes(skip))) {
          continue;
        }

        if (entry.isDirectory()) {
          await scanDir(fullPath);
        } else if (entry.isFile()) {
          await scanFile(fullPath);
          filesScanned++;
        }
      }
    } catch {
      // Skip directories we can't read
    }
  }

  async function scanFile(filePath: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        for (const { type, pattern } of SECRET_PATTERNS) {
          const matches = line.matchAll(pattern);

          for (const match of matches) {
            secrets.push({
              file: path.relative(cwd, filePath),
              line: i + 1,
              type,
              value: redactSecret(match[0]),
            });
          }
        }
      }
    } catch {
      // Skip files we can't read
    }
  }

  await scanDir(cwd);

  return {
    secrets,
    clean: secrets.length === 0,
  };
}

function redactSecret(value: string): string {
  if (value.length <= 8) {
    return '***REDACTED***';
  }

  return value.substring(0, 4) + '***REDACTED***' + value.substring(value.length - 4);
}
