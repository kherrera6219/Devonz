/**
 * Test Tools for Agent Operations
 * Provides test execution, type checking, and linting capabilities
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';

const execAsync = promisify(exec);

// Test result structure
export interface TestResult {
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  failures: Array<{
    name: string;
    message: string;
  }>;
}

// Run vitest tests
const runTestsTool = tool(
  async ({ pattern, watch }: { pattern?: string; watch?: boolean }) => {
    try {
      const args = watch ? '' : '--run';
      const testPattern = pattern ? `--testNamePattern="${pattern}"` : '';
      const command = `npx vitest ${args} ${testPattern} --reporter=json`.trim();

      const { stdout, stderr: _stderr } = await execAsync(command, {
        cwd: process.cwd(),
        timeout: 300000, // 5 minute timeout for tests
        maxBuffer: 1024 * 1024 * 50, // 50MB buffer for test output
      });

      // Parse vitest JSON output
      try {
        const results = JSON.parse(stdout);
        return {
          success: true,
          passed: results.numPassedTests || 0,
          failed: results.numFailedTests || 0,
          skipped: results.numPendingTests || 0,
          duration: results.testResults?.[0]?.perfStats?.runtime || 0,
          failures:
            results.testResults
              ?.filter((t: any) => t.status === 'failed')
              .map((t: any) => ({
                name: t.name,
                message: t.message || 'Test failed',
              })) || [],
        };
      } catch {
        // If JSON parsing fails, return raw output
        return {
          success: stdout.includes('passed') && !stdout.includes('failed'),
          output: stdout,
          stderr: _stderr,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        stderr: error.stderr || '',
      };
    }
  },
  {
    name: 'runTests',
    description: 'Run vitest tests and return results',
    schema: z.object({
      pattern: z.string().optional().describe('Test name pattern to filter'),
      watch: z.boolean().optional().describe('Run in watch mode'),
    }),
  },
);

// Run TypeScript type checking
const runTypeCheckTool = tool(
  async ({ strict }: { strict?: boolean }) => {
    try {
      const args = strict ? '--strict' : '';
      const command = `npx tsc --noEmit ${args}`;

      const { stdout } = await execAsync(command, {
        cwd: process.cwd(),
        timeout: 120000, // 2 minute timeout
      });

      return {
        success: true,
        errors: [],
        output: stdout || 'No type errors found',
      };
    } catch (error: any) {
      // Parse TypeScript errors from stderr/stdout
      const errorOutput = error.stdout || error.stderr || '';
      const errors = errorOutput
        .split('\n')
        .filter((line: string) => line.includes('error TS'))
        .map((line: string) => {
          const match = line.match(/(.+)\((\d+),(\d+)\): error (TS\d+): (.+)/);

          if (match) {
            return {
              file: match[1],
              line: parseInt(match[2], 10),
              column: parseInt(match[3], 10),
              code: match[4],
              message: match[5],
            };
          }

          return { raw: line };
        });

      return {
        success: false,
        errors,
        errorCount: errors.length,
        output: errorOutput,
      };
    }
  },
  {
    name: 'runTypeCheck',
    description: 'Run TypeScript type checking on the project',
    schema: z.object({
      strict: z.boolean().optional().describe('Use strict mode'),
    }),
  },
);

// Run ESLint
const runLintTool = tool(
  async ({ files, fix }: { files?: string; fix?: boolean }) => {
    try {
      const fixArg = fix ? '--fix' : '';
      const filesArg = files || '.';
      const command = `npx eslint ${filesArg} ${fixArg} --format=json`;

      const { stdout } = await execAsync(command, {
        cwd: process.cwd(),
        timeout: 120000,
      });

      const results = JSON.parse(stdout);
      const issues = results.flatMap((file: any) =>
        file.messages.map((msg: any) => ({
          file: file.filePath,
          line: msg.line,
          column: msg.column,
          severity: msg.severity === 2 ? 'error' : 'warning',
          message: msg.message,
          rule: msg.ruleId,
        })),
      );

      return {
        success: issues.filter((i: any) => i.severity === 'error').length === 0,
        issues,
        errorCount: issues.filter((i: any) => i.severity === 'error').length,
        warningCount: issues.filter((i: any) => i.severity === 'warning').length,
      };
    } catch (error: any) {
      // ESLint exits with error code when issues found
      try {
        const results = JSON.parse(error.stdout || '[]');
        const issues = results.flatMap((file: any) =>
          file.messages.map((msg: any) => ({
            file: file.filePath,
            line: msg.line,
            severity: msg.severity === 2 ? 'error' : 'warning',
            message: msg.message,
            rule: msg.ruleId,
          })),
        );

        return {
          success: false,
          issues,
          errorCount: issues.filter((i: any) => i.severity === 'error').length,
          warningCount: issues.filter((i: any) => i.severity === 'warning').length,
        };
      } catch {
        return {
          success: false,
          error: error.message,
          output: error.stderr || error.stdout,
        };
      }
    }
  },
  {
    name: 'runLint',
    description: 'Run ESLint on specified files or the entire project',
    schema: z.object({
      files: z.string().optional().describe('Files or directories to lint'),
      fix: z.boolean().optional().describe('Automatically fix problems'),
    }),
  },
);

// Export all test tools
export const testTools = {
  runTests: runTestsTool,
  runTypeCheck: runTypeCheckTool,
  runLint: runLintTool,
};
