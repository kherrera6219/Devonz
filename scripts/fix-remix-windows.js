/**
 * Windows ESM Compatibility Patches
 *
 * On Windows, Node.js ESM loader doesn't accept bare absolute paths like C:\...
 * in dynamic import() — it expects valid file:// URLs.
 *
 * This script patches two packages:
 * 1. @remix-run/dev/dist/vite/resolve-file-url.js
 *    - Returns file:/// URLs for out-of-root Windows paths
 * 2. vite-node/dist/client.mjs & client.cjs
 *    - importExternalModule() converts bare Windows paths to file:// before import()
 *
 * Run automatically via postinstall.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// ─── Patch 1: @remix-run/dev resolve-file-url.js ───────────────────────────

const resolveFileUrlPath = path.join(
  rootDir, 'node_modules', '@remix-run', 'dev', 'dist', 'vite', 'resolve-file-url.js'
);

function patchResolveFileUrl() {
  if (!fs.existsSync(resolveFileUrlPath)) {
    console.warn('[fix-remix-windows] Could not find resolve-file-url.js — skipping.');
    return;
  }

  let content = fs.readFileSync(resolveFileUrlPath, 'utf8');

  if (content.includes("process.platform === 'win32'")) {
    console.log('[fix-remix-windows] resolve-file-url.js already patched.');
    return;
  }

  // Target: the line that returns the /@fs/ path for out-of-root files
  const target = 'return path__namespace.posix.join("/@fs", vite$1.normalizePath(filePath));';
  const replacement = `
    let normalizedPath = vite$1.normalizePath(filePath);
    if (process.platform === 'win32' && /^[a-zA-Z]:/.test(normalizedPath)) {
      return 'file:///' + normalizedPath;
    }
    return path__namespace.posix.join("/@fs", normalizedPath);
  `;

  const patched = content.replace(target, replacement);
  if (patched === content) {
    console.error('[fix-remix-windows] resolve-file-url.js: target string not found — patch skipped.');
    return;
  }

  fs.writeFileSync(resolveFileUrlPath, patched);
  console.log('[fix-remix-windows] Successfully patched resolve-file-url.js');
}

// ─── Patch 2: vite-node importExternalModule ──────────────────────────────

const VITE_NODE_IMPORT_TARGET = `  importExternalModule(path) {
    return import(path);
  }`;

const VITE_NODE_IMPORT_REPLACEMENT = `  importExternalModule(path) {
    // On Windows, bare absolute paths like C:\\... cause ERR_UNSUPPORTED_ESM_URL_SCHEME
    // because the Node ESM loader treats 'c:' as an unsupported URL scheme.
    // Convert to a proper file:// URL before importing.
    if (process.platform === 'win32' && /^[a-zA-Z]:/.test(path)) {
      const { pathToFileURL } = require('node:url');
      return import(pathToFileURL(path).href);
    }
    return import(path);
  }`;

const VITE_NODE_IMPORT_REPLACEMENT_MJS = `  importExternalModule(path) {
    // On Windows, bare absolute paths like C:\\... cause ERR_UNSUPPORTED_ESM_URL_SCHEME
    // because the Node ESM loader treats 'c:' as an unsupported URL scheme.
    // Convert to a proper file:// URL before importing.
    if (process.platform === 'win32' && /^[a-zA-Z]:/.test(path)) {
      return import(pathToFileURL(path).href);
    }
    return import(path);
  }`;

function patchViteNodeFile(filePath, replacement) {
  if (!fs.existsSync(filePath)) {
    console.warn(`[fix-remix-windows] Could not find ${path.basename(filePath)} — skipping.`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  if (content.includes('ERR_UNSUPPORTED_ESM_URL_SCHEME')) {
    console.log(`[fix-remix-windows] ${path.basename(filePath)} already patched.`);
    return;
  }

  const patched = content.replace(VITE_NODE_IMPORT_TARGET, replacement);
  if (patched === content) {
    console.error(`[fix-remix-windows] ${path.basename(filePath)}: target string not found — patch skipped.`);
    return;
  }

  fs.writeFileSync(filePath, patched);
  console.log(`[fix-remix-windows] Successfully patched ${path.basename(filePath)}`);
}

function patchViteNode() {
  const viteNodeDist = path.join(rootDir, 'node_modules', 'vite-node', 'dist');
  patchViteNodeFile(path.join(viteNodeDist, 'client.mjs'), VITE_NODE_IMPORT_REPLACEMENT_MJS);
  patchViteNodeFile(path.join(viteNodeDist, 'client.cjs'), VITE_NODE_IMPORT_REPLACEMENT);
}

// ─── Run all patches ──────────────────────────────────────────────────────

patchResolveFileUrl();
patchViteNode();
