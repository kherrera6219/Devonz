/**
 * MCP Execution Tools
 *
 * Tools for running lint, typecheck, tests, build, and other commands.
 * All commands are wrapped as named tools - no raw shell access.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import type {
  RunLintResult,
  RunTypecheckResult,
  RunTestsResult,
  RunBuildResult,
} from '~/lib/mcp/types';

const execAsync = promisify(exec);

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_CWD = process.cwd();
const COMMAND_TIMEOUT = 120000; // 2 minutes

// ═══════════════════════════════════════════════════════════════════════════
// LINT
// ═══════════════════════════════════════════════════════════════════════════

interface LintArgs {
  cwd?: string;
  fix?: boolean;
  files?: string[];
}

export async function lint(args: LintArgs): Promise<RunLintResult> {
  const cwd = args.cwd || DEFAULT_CWD;
  const fix = args.fix ? '--fix' : '';
  const files = args.files?.join(' ') || '.';

  const command = `npx eslint ${files} --format json ${fix}`.trim();

  try {
    const { stdout } = await execAsync(command, { cwd, timeout: COMMAND_TIMEOUT });
    const results = JSON.parse(stdout);

    const issues: RunLintResult['issues'] = [];
    let errorCount = 0;
    let warningCount = 0;
    let fixableCount = 0;

    for (const file of results) {
      for (const msg of file.messages) {
        issues.push({
          file: file.filePath,
          line: msg.line,
          column: msg.column,
          severity: msg.severity === 2 ? 'error' : 'warning',
          rule: msg.ruleId || 'unknown',
          message: msg.message,
        });

        if (msg.severity === 2) {
          errorCount++;
        } else {
          warningCount++;
        }

        if (msg.fix) {
          fixableCount++;
        }
      }
    }

    return {
      exitCode: errorCount > 0 ? 1 : 0,
      issues,
      errorCount,
      warningCount,
      fixableCount,
    };
  } catch (error: any) {
    // ESLint returns non-zero on lint errors
    if (error.stdout) {
      try {
        const results = JSON.parse(error.stdout);
        const issues: RunLintResult['issues'] = [];
        let errorCount = 0;
        let warningCount = 0;

        for (const file of results) {
          for (const msg of file.messages) {
            issues.push({
              file: file.filePath,
              line: msg.line,
              column: msg.column,
              severity: msg.severity === 2 ? 'error' : 'warning',
              rule: msg.ruleId || 'unknown',
              message: msg.message,
            });

            if (msg.severity === 2) {
              errorCount++;
            } else {
              warningCount++;
            }
          }
        }

        return {
          exitCode: 1,
          issues,
          errorCount,
          warningCount,
          fixableCount: 0,
        };
      } catch {
        // Fall through to error case
      }
    }

    return {
      exitCode: 1,
      issues: [
        {
          file: '',
          line: 0,
          column: 0,
          severity: 'error',
          rule: 'lint-error',
          message: error.message || String(error),
        },
      ],
      errorCount: 1,
      warningCount: 0,
      fixableCount: 0,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPECHECK
// ═══════════════════════════════════════════════════════════════════════════

interface TypecheckArgs {
  cwd?: string;
}

export async function typecheck(args: TypecheckArgs): Promise<RunTypecheckResult> {
  const cwd = args.cwd || DEFAULT_CWD;
  const command = 'npx tsc --noEmit --pretty false';

  try {
    await execAsync(command, { cwd, timeout: COMMAND_TIMEOUT });

    return {
      exitCode: 0,
      errors: [],
      errorCount: 0,
    };
  } catch (error: any) {
    const output = error.stdout || error.stderr || '';
    const errors: RunTypecheckResult['errors'] = [];

    // Parse TypeScript errors
    const errorPattern = /(.+)\((\d+),(\d+)\): error (TS\d+): (.+)/g;
    let match;

    while ((match = errorPattern.exec(output)) !== null) {
      errors.push({
        file: match[1],
        line: parseInt(match[2]),
        column: parseInt(match[3]),
        code: match[4],
        message: match[5],
      });
    }

    return {
      exitCode: 1,
      errors,
      errorCount: errors.length,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════

interface TestsArgs {
  cwd?: string;
  coverage?: boolean;
  pattern?: string;
}

export async function tests(args: TestsArgs): Promise<RunTestsResult> {
  const cwd = args.cwd || DEFAULT_CWD;
  const coverage = args.coverage ? '--coverage' : '';
  const pattern = args.pattern ? `--testPathPattern="${args.pattern}"` : '';

  const command = `npx vitest run --reporter=json ${coverage} ${pattern}`.trim();

  try {
    const { stdout } = await execAsync(command, { cwd, timeout: COMMAND_TIMEOUT * 2 });
    const results = JSON.parse(stdout);

    return {
      exitCode: 0,
      passed: results.numPassedTests || 0,
      failed: results.numFailedTests || 0,
      skipped: results.numPendingTests || 0,
      duration: results.testResults?.reduce((sum: number, t: any) => sum + (t.duration || 0), 0) || 0,
      coverage: results.coverageMap
        ? {
            statements: results.coverageMap.getCoverageSummary?.().statements?.pct || 0,
            branches: results.coverageMap.getCoverageSummary?.().branches?.pct || 0,
            functions: results.coverageMap.getCoverageSummary?.().functions?.pct || 0,
            lines: results.coverageMap.getCoverageSummary?.().lines?.pct || 0,
          }
        : undefined,
    };
  } catch (error: any) {
    return {
      exitCode: 1,
      passed: 0,
      failed: 1,
      skipped: 0,
      duration: 0,
      failures: [
        {
          name: 'Test execution failed',
          file: '',
          error: error.message || String(error),
        },
      ],
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// BUILD
// ═══════════════════════════════════════════════════════════════════════════

interface BuildArgs {
  cwd?: string;
}

export async function build(args: BuildArgs): Promise<RunBuildResult> {
  const cwd = args.cwd || DEFAULT_CWD;
  const command = 'npm run build';
  const startTime = Date.now();

  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd,
      timeout: COMMAND_TIMEOUT * 3,
    });

    // Parse warnings from output
    const warnings: string[] = [];
    const warningPattern = /warning/gi;

    if (warningPattern.test(stdout + stderr)) {
      warnings.push('Build completed with warnings');
    }

    return {
      exitCode: 0,
      success: true,
      duration: Date.now() - startTime,
      artifacts: ['dist/', 'build/'], // Common output dirs
      errors: [],
      warnings,
    };
  } catch (error: any) {
    const output = error.stdout || error.stderr || error.message;
    const errors: string[] = [output.substring(0, 1000)];

    return {
      exitCode: 1,
      success: false,
      duration: Date.now() - startTime,
      artifacts: [],
      errors,
      warnings: [],
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// INSTALL (GATED - REQUIRES APPROVAL)
// ═══════════════════════════════════════════════════════════════════════════

interface InstallArgs {
  cwd?: string;
  packages?: string[];
  dev?: boolean;
}

export async function install(args: InstallArgs): Promise<{
  success: boolean;
  installed: string[];
  error?: string;
}> {
  const cwd = args.cwd || DEFAULT_CWD;
  const packages = args.packages?.join(' ') || '';
  const dev = args.dev ? '--save-dev' : '';

  const command = packages
    ? `npm install ${packages} ${dev}`.trim()
    : 'npm install';

  try {
    await execAsync(command, { cwd, timeout: COMMAND_TIMEOUT * 2 });

    return {
      success: true,
      installed: args.packages || ['all dependencies'],
    };
  } catch (error: any) {
    return {
      success: false,
      installed: [],
      error: error.message || String(error),
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FORMAT
// ═══════════════════════════════════════════════════════════════════════════

interface FormatArgs {
  cwd?: string;
  files?: string[];
}

export async function format(args: FormatArgs): Promise<{
  success: boolean;
  filesChanged: string[];
}> {
  const cwd = args.cwd || DEFAULT_CWD;
  const files = args.files?.join(' ') || '.';

  const command = `npx prettier --write ${files}`;

  try {
    const { stdout } = await execAsync(command, { cwd, timeout: COMMAND_TIMEOUT });

    // Parse formatted files from output
    const filesChanged = stdout
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .map((line) => line.trim());

    return {
      success: true,
      filesChanged,
    };
  } catch (error: any) {
    return {
      success: false,
      filesChanged: [],
    };
  }
}
