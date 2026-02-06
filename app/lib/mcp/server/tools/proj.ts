/**
 * MCP Project Intelligence Tools
 *
 * Tools for extracting project configuration, dependencies, and route maps.
 * Helps agents understand the project structure without guessing.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { ProjConfigResult, ProjDepsResult, ProjRoutesResult } from '~/lib/mcp/types';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_CWD = process.cwd();

// Config files to look for
const CONFIG_FILES: Record<string, string> = {
  tsconfig: 'tsconfig.json',
  eslint: '.eslintrc.json',
  prettier: '.prettierrc',
  vite: 'vite.config.ts',
  remix: 'remix.config.js',
};

// ═══════════════════════════════════════════════════════════════════════════
// GET CONFIG
// ═══════════════════════════════════════════════════════════════════════════

interface GetConfigArgs {
  cwd?: string;
}

export async function getConfig(args: GetConfigArgs): Promise<ProjConfigResult> {
  const cwd = args.cwd || DEFAULT_CWD;

  // Detect framework
  const framework = await detectFramework(cwd);

  // Read configs
  const configs: ProjConfigResult['configs'] = {};

  for (const [name, filename] of Object.entries(CONFIG_FILES)) {
    try {
      const content = await fs.readFile(path.join(cwd, filename), 'utf-8');
      (configs as any)[name] = JSON.parse(content);
    } catch {
      // Config doesn't exist or isn't JSON
    }
  }

  // Handle non-JSON configs
  try {
    const prettierPath = path.join(cwd, '.prettierrc');
    const content = await fs.readFile(prettierPath, 'utf-8');

    try {
      configs.prettier = JSON.parse(content);
    } catch {
      // Not JSON, maybe YAML or just a string
      configs.prettier = { raw: content };
    }
  } catch {
    // No prettier config
  }

  // Read package.json
  let packageJson: ProjConfigResult['packageJson'] = {
    name: 'unknown',
    version: '0.0.0',
    dependencies: {},
    devDependencies: {},
  };

  try {
    const content = await fs.readFile(path.join(cwd, 'package.json'), 'utf-8');
    const pkg = JSON.parse(content);
    packageJson = {
      name: pkg.name || 'unknown',
      version: pkg.version || '0.0.0',
      dependencies: pkg.dependencies || {},
      devDependencies: pkg.devDependencies || {},
    };
  } catch {
    // No package.json
  }

  return {
    framework,
    configs,
    packageJson,
  };
}

async function detectFramework(cwd: string): Promise<string> {
  try {
    const pkg = JSON.parse(await fs.readFile(path.join(cwd, 'package.json'), 'utf-8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    if (deps['@remix-run/react']) {
      return 'remix';
    }

    if (deps['next']) {
      return 'next';
    }

    if (deps['vite']) {
      return 'vite';
    }

    if (deps['react']) {
      return 'react';
    }

    if (deps['vue']) {
      return 'vue';
    }

    if (deps['express']) {
      return 'express';
    }

    return 'node';
  } catch {
    return 'unknown';
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// GET DEPENDENCIES
// ═══════════════════════════════════════════════════════════════════════════

interface GetDepsArgs {
  cwd?: string;
}

export async function getDependencies(args: GetDepsArgs): Promise<ProjDepsResult> {
  const cwd = args.cwd || DEFAULT_CWD;

  const dependencies: ProjDepsResult['dependencies'] = [];
  const graph: ProjDepsResult['graph'] = {};

  try {
    const pkg = JSON.parse(await fs.readFile(path.join(cwd, 'package.json'), 'utf-8'));

    // Production dependencies
    for (const [name, version] of Object.entries(pkg.dependencies || {} as Record<string, string>)) {
      dependencies.push({
        name,
        version: version as string,
        type: 'prod',
      });
    }

    // Dev dependencies
    for (const [name, version] of Object.entries(pkg.devDependencies || {} as Record<string, string>)) {
      dependencies.push({
        name,
        version: version as string,
        type: 'dev',
      });
    }

    // Build simple dependency graph from package-lock.json if available
    try {
      const lockfile = JSON.parse(await fs.readFile(path.join(cwd, 'package-lock.json'), 'utf-8'));

      for (const [name, details] of Object.entries(lockfile.packages || {})) {
        if (name === '') {
          continue;
        }

        const entry = details as { dependencies?: Record<string, string> };
        const pkgName = name.replace('node_modules/', '');
        const deps = Object.keys(entry.dependencies || {});

        if (deps.length > 0) {
          graph[pkgName] = deps;
        }
      }
    } catch {
      // No lockfile or can't parse
    }
  } catch {
    // No package.json
  }

  return {
    dependencies,
    graph,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// GET ROUTES (Remix)
// ═══════════════════════════════════════════════════════════════════════════

interface GetRoutesArgs {
  cwd?: string;
}

export async function getRoutes(args: GetRoutesArgs): Promise<ProjRoutesResult> {
  const cwd = args.cwd || DEFAULT_CWD;
  const routes: ProjRoutesResult['routes'] = [];

  // Look for Remix routes
  const routesDir = path.join(cwd, 'app', 'routes');

  try {
    await scanRoutesDir(routesDir, '', routes);
  } catch {
    // Not a Remix app or routes dir doesn't exist
  }

  return { routes };
}

async function scanRoutesDir(
  dir: string,
  prefix: string,
  routes: ProjRoutesResult['routes'],
): Promise<void> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Nested routes
        await scanRoutesDir(fullPath, `${prefix}/${entry.name}`, routes);
      } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
        const routePath = parseRoutePath(prefix, entry.name);
        const content = await fs.readFile(fullPath, 'utf-8');

        routes.push({
          path: routePath,
          file: fullPath,
          hasLoader: content.includes('export function loader') || content.includes('export const loader'),
          hasAction: content.includes('export function action') || content.includes('export const action'),
        });
      }
    }
  } catch {
    // Can't read directory
  }
}

function parseRoutePath(prefix: string, filename: string): string {
  // Remove extension
  let route = filename.replace(/\.(tsx?|jsx?)$/, '');

  // Handle index routes
  if (route === 'index' || route === '_index') {
    return prefix || '/';
  }

  // Handle dynamic segments
  route = route.replace(/\$/g, ':');

  // Handle splat routes
  route = route.replace(/\[\.\.\.\]/g, '*');

  // Handle layout routes
  route = route.replace(/^_/, '');

  // Handle dot notation (e.g., api.chat → /api/chat)
  route = route.replace(/\./g, '/');

  return `${prefix}/${route}`;
}
