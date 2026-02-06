/**
 * MCP - Model Context Protocol
 *
 * Provides structured tool access to the multi-agent orchestrator.
 *
 * Architecture:
 * - MCP Client: Gateway that enforces permissions and logs calls
 * - MCP Server: Factory floor with workspace/execution tools
 *
 * Agent Permissions:
 * - Coordinator (GPT-5.2): Full access, human-facing
 * - Researcher (Gemini): Read-only + security scans
 * - Architect (Claude): Read + patch + validation
 */

// Client (use this for agent tool calls)
export { getMCPClient, MCPClient } from '~/lib/mcp/client';
export * from '~/lib/mcp/client/permissions';

// Server (direct tool access)
export { getToolManifest, tools } from '~/lib/mcp/server';
export * from '~/lib/mcp/server/audit';

// Types
export * from '~/lib/mcp/types';
