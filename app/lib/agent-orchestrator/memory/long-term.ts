/**
 * Long-Term Memory for Agent Operations
 * Persistent storage for user preferences, project history, and learned patterns
 */

import * as fs from 'fs/promises';
import * as path from 'path';

// Storage location for long-term memory
const MEMORY_DIR = path.join(process.cwd(), '.agent-memory');
const PREFERENCES_FILE = path.join(MEMORY_DIR, 'preferences.json');
const HISTORY_FILE = path.join(MEMORY_DIR, 'history.json');

export interface UserPreferences {
  defaultModel?: string;
  codeStyle?: 'verbose' | 'concise';
  testingFramework?: string;
  preferredLanguage?: string;
  customRules?: string[];
}

export interface ProjectHistory {
  lastAccessed: number;
  completedTasks: Array<{
    description: string;
    timestamp: number;
    success: boolean;
  }>;
  learnedPatterns: Record<string, string>;
}

// In-memory cache
let preferencesCache: UserPreferences | null = null;
let historyCache: ProjectHistory | null = null;

/**
 * Ensure memory directory exists
 */
async function ensureMemoryDir(): Promise<void> {
  try {
    await fs.mkdir(MEMORY_DIR, { recursive: true });
  } catch {
    // Directory may already exist
  }
}

/**
 * Load user preferences
 */
export async function loadPreferences(): Promise<UserPreferences> {
  if (preferencesCache) {
    return preferencesCache;
  }

  try {
    await ensureMemoryDir();

    const data = await fs.readFile(PREFERENCES_FILE, 'utf-8');
    preferencesCache = JSON.parse(data);

    return preferencesCache!;
  } catch {
    // Return defaults if file doesn't exist
    preferencesCache = {};
    return preferencesCache;
  }
}

/**
 * Save user preferences
 */
export async function savePreferences(prefs: UserPreferences): Promise<void> {
  await ensureMemoryDir();
  preferencesCache = { ...preferencesCache, ...prefs };
  await fs.writeFile(PREFERENCES_FILE, JSON.stringify(preferencesCache, null, 2));
}

/**
 * Load project history
 */
export async function loadHistory(): Promise<ProjectHistory> {
  if (historyCache) {
    return historyCache;
  }

  try {
    await ensureMemoryDir();

    const data = await fs.readFile(HISTORY_FILE, 'utf-8');
    historyCache = JSON.parse(data);

    return historyCache!;
  } catch {
    historyCache = {
      lastAccessed: Date.now(),
      completedTasks: [],
      learnedPatterns: {},
    };
    return historyCache;
  }
}

/**
 * Record a completed task
 */
export async function recordTask(description: string, success: boolean): Promise<void> {
  const history = await loadHistory();
  history.completedTasks.push({
    description,
    timestamp: Date.now(),
    success,
  });

  // Keep only last 100 tasks
  if (history.completedTasks.length > 100) {
    history.completedTasks = history.completedTasks.slice(-100);
  }

  history.lastAccessed = Date.now();
  await fs.writeFile(HISTORY_FILE, JSON.stringify(history, null, 2));
}

/**
 * Learn a pattern (e.g., code conventions, naming)
 */
export async function learnPattern(key: string, value: string): Promise<void> {
  const history = await loadHistory();
  history.learnedPatterns[key] = value;
  await fs.writeFile(HISTORY_FILE, JSON.stringify(history, null, 2));
}

/**
 * Get learned pattern
 */
export async function getPattern(key: string): Promise<string | undefined> {
  const history = await loadHistory();
  return history.learnedPatterns[key];
}

/**
 * Get recent successful tasks for context
 */
export async function getRecentTasks(limit: number = 5): Promise<Array<{ description: string; timestamp: number }>> {
  const history = await loadHistory();
  return history.completedTasks
    .filter((t) => t.success)
    .slice(-limit)
    .map((t) => ({ description: t.description, timestamp: t.timestamp }));
}

/**
 * Clear all long-term memory
 */
export async function clearLongTermMemory(): Promise<void> {
  preferencesCache = null;
  historyCache = null;

  try {
    await fs.unlink(PREFERENCES_FILE);
  } catch {}

  try {
    await fs.unlink(HISTORY_FILE);
  } catch {}
}
