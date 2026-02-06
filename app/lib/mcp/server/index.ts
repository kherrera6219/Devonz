/**
 * MCP Server Entry Point
 *
 * The MCP Server provides structured tool access to the multi-agent system.
 * It is the "factory floor" for workspace and dev runtime operations.
 */

// Re-export tools
export * as fsTools from '~/lib/mcp/server/tools/fs';
export * as runTools from '~/lib/mcp/server/tools/run';
export * as secTools from '~/lib/mcp/server/tools/sec';
export * as projTools from '~/lib/mcp/server/tools/proj';

// Re-export audit
export * from '~/lib/mcp/server/audit';

// Tool registry for direct access
import * as fsTools from '~/lib/mcp/server/tools/fs';
import * as runTools from '~/lib/mcp/server/tools/run';
import * as secTools from '~/lib/mcp/server/tools/sec';
import * as projTools from '~/lib/mcp/server/tools/proj';

/**
 * Get all available tools with their metadata
 */
export function getToolManifest() {
  return {
    version: '1.0.0',
    categories: {
      fs: {
        description: 'File system operations (read, search, patch)',
        tools: ['listTree', 'readFile', 'readFiles', 'search', 'applyPatch'],
      },
      run: {
        description: 'Execution tools (lint, typecheck, tests, build)',
        tools: ['lint', 'typecheck', 'tests', 'build', 'install', 'format'],
      },
      sec: {
        description: 'Security scanning tools',
        tools: ['npmAudit', 'semgrepScan', 'secretScan'],
      },
      proj: {
        description: 'Project intelligence tools',
        tools: ['getConfig', 'getDependencies', 'getRoutes'],
      },
    },
    guardrails: {
      allWritesArePatch: true,
      researcherReadOnly: true,
      installRequiresApproval: true,
      deleteRequiresApproval: true,
    },
  };
}

/**
 * Direct tool access (for internal use)
 */
export const tools = {
  fs: fsTools,
  run: runTools,
  sec: secTools,
  proj: projTools,
};
