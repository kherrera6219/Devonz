/**
 * Memory System Index
 * Central module for agent memory management
 */

export * from './short-term';
export * from './long-term';

import {
  getShortTermMemory,
  addMessage,
  getRecentMessages,
  updateContext,
  getContext,
  clearMemory,
  cleanupExpiredMemories,
  getMemoryStats,
} from './short-term';

import {
  loadPreferences,
  savePreferences,
  loadHistory,
  recordTask,
  learnPattern,
  getPattern,
  getRecentTasks,
  clearLongTermMemory,
  type UserPreferences,
  type ProjectHistory,
} from './long-term';

/**
 * Unified memory interface for agents
 */
export const memory = {
  // Short-term (thread-scoped)
  shortTerm: {
    get: getShortTermMemory,
    addMessage,
    getRecentMessages,
    updateContext,
    getContext,
    clear: clearMemory,
    cleanup: cleanupExpiredMemories,
    stats: getMemoryStats,
  },

  // Long-term (persistent)
  longTerm: {
    loadPreferences,
    savePreferences,
    loadHistory,
    recordTask,
    learnPattern,
    getPattern,
    getRecentTasks,
    clear: clearLongTermMemory,
  },
};

export type { UserPreferences, ProjectHistory };
