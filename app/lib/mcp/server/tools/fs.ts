/**
 * MCP File System Tools
 *
 * Tools for reading, searching, and patching repository files.
 * All writes go through unified diff patches - no direct overwrites.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { FsListTreeResult, FsReadFileResult, FsSearchResult, FsApplyPatchResult } from '~/lib/mcp/types';

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * CONFIGURATION
 * ═══════════════════════════════════════════════════════════════════════════
 */

const DEFAULT_ROOT = process.cwd();
const IGNORED_DIRS = ['node_modules', '.git', 'dist', 'build', '.next', '.cache'];
const MAX_FILE_SIZE = 1024 * 1024; // 1MB max read
const MAX_TREE_DEPTH = 10;

// Language detection by extension
const LANG_MAP: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.json': 'json',
  '.md': 'markdown',
  '.css': 'css',
  '.html': 'html',
  '.py': 'python',
  '.yaml': 'yaml',
  '.yml': 'yaml',
};

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * LIST TREE
 * ═══════════════════════════════════════════════════════════════════════════
 */

interface ListTreeArgs {
  root?: string;
  depth?: number;
  pattern?: string;
}

export async function listTree(args: ListTreeArgs): Promise<FsListTreeResult> {
  const root = args.root || DEFAULT_ROOT;
  const maxDepth = Math.min(args.depth || 5, MAX_TREE_DEPTH);
  const pattern = args.pattern ? new RegExp(args.pattern) : null;

  const files: FsListTreeResult['files'] = [];
  const dirs: string[] = [];

  async function walk(dir: string, currentDepth: number): Promise<void> {
    if (currentDepth > maxDepth) {
      return;
    }

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(root, fullPath);

        // Skip ignored directories
        if (IGNORED_DIRS.includes(entry.name)) {
          continue;
        }

        if (entry.isDirectory()) {
          dirs.push(relativePath);
          await walk(fullPath, currentDepth + 1);
        } else if (entry.isFile()) {
          // Apply pattern filter
          if (pattern && !pattern.test(entry.name)) {
            continue;
          }

          try {
            const stats = await fs.stat(fullPath);
            const ext = path.extname(entry.name);

            files.push({
              path: relativePath,
              size: stats.size,
              language: LANG_MAP[ext] || 'text',
            });
          } catch {
            // Skip files we can't stat
          }
        }
      }
    } catch {
      // Skip directories we can't read
    }
  }

  await walk(root, 0);

  return {
    root,
    files,
    dirs,
    totalFiles: files.length,
    totalDirs: dirs.length,
  };
}

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * READ FILE
 * ═══════════════════════════════════════════════════════════════════════════
 */

interface ReadFileArgs {
  path: string;
  root?: string;
}

export async function readFile(args: ReadFileArgs): Promise<FsReadFileResult> {
  const root = args.root || DEFAULT_ROOT;
  const fullPath = path.isAbsolute(args.path) ? args.path : path.join(root, args.path);

  // Security check - ensure path is within root
  if (!fullPath.startsWith(root)) {
    throw new Error('Path traversal detected');
  }

  const stats = await fs.stat(fullPath);

  if (stats.size > MAX_FILE_SIZE) {
    throw new Error(`File too large: ${stats.size} bytes (max ${MAX_FILE_SIZE})`);
  }

  const content = await fs.readFile(fullPath, 'utf-8');
  const ext = path.extname(args.path);

  return {
    path: args.path,
    content,
    language: LANG_MAP[ext] || 'text',
    size: stats.size,
    encoding: 'utf-8',
  };
}

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * READ FILES (BATCH)
 * ═══════════════════════════════════════════════════════════════════════════
 */

interface ReadFilesArgs {
  paths: string[];
  root?: string;
}

export async function readFiles(
  args: ReadFilesArgs,
): Promise<{ files: FsReadFileResult[]; errors: Array<{ path: string; error: string }> }> {
  const results: FsReadFileResult[] = [];
  const errors: Array<{ path: string; error: string }> = [];

  for (const filePath of args.paths) {
    try {
      const result = await readFile({ path: filePath, root: args.root });
      results.push(result);
    } catch (error: any) {
      errors.push({ path: filePath, error: error.message });
    }
  }

  return { files: results, errors };
}

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * SEARCH
 * ═══════════════════════════════════════════════════════════════════════════
 */

interface SearchArgs {
  query: string;
  root?: string;
  pattern?: string; // File pattern (e.g., "*.ts")
  maxResults?: number;
}

export async function search(args: SearchArgs): Promise<FsSearchResult> {
  const root = args.root || DEFAULT_ROOT;
  const maxResults = args.maxResults || 100;
  const filePattern = args.pattern ? new RegExp(args.pattern.replace('*', '.*')) : null;

  const matches: FsSearchResult['matches'] = [];
  let filesSearched = 0;

  // Get all files first
  const tree = await listTree({ root, depth: 8 });

  for (const file of tree.files) {
    if (matches.length >= maxResults) {
      break;
    }

    // Apply file pattern filter
    if (filePattern && !filePattern.test(file.path)) {
      continue;
    }

    try {
      const fullPath = path.join(root, file.path);
      const content = await fs.readFile(fullPath, 'utf-8');
      filesSearched++;

      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const column = line.indexOf(args.query);

        if (column !== -1) {
          matches.push({
            file: file.path,
            line: i + 1,
            column: column + 1,
            text: line.trim(),
            context: lines.slice(Math.max(0, i - 1), i + 2).join('\n'),
          });

          if (matches.length >= maxResults) {
            break;
          }
        }
      }
    } catch {
      // Skip files we can't read
    }
  }

  return {
    query: args.query,
    matches,
    totalMatches: matches.length,
    filesSearched,
  };
}

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * APPLY PATCH (THE MAIN WRITE METHOD)
 * ═══════════════════════════════════════════════════════════════════════════
 */

interface ApplyPatchArgs {
  patch: string; // Unified diff format
  root?: string;
  dryRun?: boolean;
}

export async function applyPatch(args: ApplyPatchArgs): Promise<FsApplyPatchResult> {
  const root = args.root || DEFAULT_ROOT;
  const dryRun = args.dryRun || false;

  // Parse unified diff
  const filesChanged: FsApplyPatchResult['filesChanged'] = [];
  const rejected: string[] = [];

  // Split patch into file chunks
  const chunks = args.patch.split(/^diff --git/m).filter(Boolean);

  for (const chunk of chunks) {
    try {
      // Extract file path from the diff header
      const fileMatch = chunk.match(/a\/(.+?) b\/(.+)/);

      if (!fileMatch) {
        continue;
      }

      const filePath = fileMatch[2];
      const fullPath = path.join(root, filePath);

      // Security check
      if (!fullPath.startsWith(root)) {
        rejected.push(`${filePath}: Path traversal detected`);
        continue;
      }

      // Parse hunks
      const hunks = parseHunks(chunk);

      if (hunks.length === 0) {
        continue;
      }

      // Determine action
      const isNewFile = chunk.includes('new file mode');
      const isDeleted = chunk.includes('deleted file mode');

      let linesAdded = 0;
      let linesRemoved = 0;

      for (const hunk of hunks) {
        linesAdded += hunk.additions;
        linesRemoved += hunk.deletions;
      }

      if (!dryRun) {
        if (isDeleted) {
          await fs.unlink(fullPath);
        } else if (isNewFile) {
          const content = extractNewFileContent(hunks);
          await fs.mkdir(path.dirname(fullPath), { recursive: true });
          await fs.writeFile(fullPath, content, 'utf-8');
        } else {
          // Apply hunks to existing file
          const content = await fs.readFile(fullPath, 'utf-8');
          const newContent = applyHunks(content, hunks);
          await fs.writeFile(fullPath, newContent, 'utf-8');
        }
      }

      filesChanged.push({
        path: filePath,
        action: isNewFile ? 'created' : isDeleted ? 'deleted' : 'modified',
        linesAdded,
        linesRemoved,
      });
    } catch (error: any) {
      rejected.push(`${error.message}`);
    }
  }

  return {
    success: rejected.length === 0,
    filesChanged,
    rejected: rejected.length > 0 ? rejected : undefined,
  };
}

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * PATCH PARSING HELPERS
 * ═══════════════════════════════════════════════════════════════════════════
 */

interface Hunk {
  startOld: number;
  countOld: number;
  startNew: number;
  countNew: number;
  lines: string[];
  additions: number;
  deletions: number;
}

function parseHunks(chunk: string): Hunk[] {
  const hunks: Hunk[] = [];
  let match;

  const lines = chunk.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    match = /@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@/.exec(line);

    if (match) {
      const hunk: Hunk = {
        startOld: parseInt(match[1]),
        countOld: parseInt(match[2] || '1'),
        startNew: parseInt(match[3]),
        countNew: parseInt(match[4] || '1'),
        lines: [],
        additions: 0,
        deletions: 0,
      };

      i++;

      while (i < lines.length && !lines[i].startsWith('@@') && !lines[i].startsWith('diff')) {
        const hunkLine = lines[i];

        if (hunkLine.startsWith('+') && !hunkLine.startsWith('+++')) {
          hunk.additions++;
        } else if (hunkLine.startsWith('-') && !hunkLine.startsWith('---')) {
          hunk.deletions++;
        }

        hunk.lines.push(hunkLine);
        i++;
      }

      hunks.push(hunk);
    } else {
      i++;
    }
  }

  return hunks;
}

function extractNewFileContent(hunks: Hunk[]): string {
  const lines: string[] = [];

  for (const hunk of hunks) {
    for (const line of hunk.lines) {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        lines.push(line.substring(1));
      }
    }
  }

  return lines.join('\n');
}

function applyHunks(content: string, hunks: Hunk[]): string {
  const lines = content.split('\n');

  // Apply hunks in reverse order to preserve line numbers
  for (const hunk of hunks.reverse()) {
    const startIndex = hunk.startOld - 1;
    const deleteCount = hunk.countOld;

    const newLines: string[] = [];

    for (const line of hunk.lines) {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        newLines.push(line.substring(1));
      } else if (line.startsWith(' ')) {
        newLines.push(line.substring(1));
      }

      // Skip lines starting with '-' (deletions)
    }

    lines.splice(startIndex, deleteCount, ...newLines);
  }

  return lines.join('\n');
}
