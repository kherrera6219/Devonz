/**
 * Short-Term Memory for Agent Operations
 * Thread-scoped conversation history and working context
 */

import type { BaseMessage } from '@langchain/core/messages';

export interface ShortTermMemory {
  threadId: string;
  messages: BaseMessage[];
  workingContext: Record<string, any>;
  createdAt: number;
  lastUpdated: number;
}

// In-memory store for short-term memory (thread-scoped)
const memoryStore = new Map<string, ShortTermMemory>();

// Maximum messages to keep in short-term memory
const MAX_MESSAGES = 50;

// Maximum age for memory (1 hour)
const MAX_AGE_MS = 60 * 60 * 1000;

/**
 * Get or create short-term memory for a thread
 */
export function getShortTermMemory(threadId: string): ShortTermMemory {
  let memory = memoryStore.get(threadId);

  if (!memory) {
    memory = {
      threadId,
      messages: [],
      workingContext: {},
      createdAt: Date.now(),
      lastUpdated: Date.now(),
    };
    memoryStore.set(threadId, memory);
  }

  return memory;
}

/**
 * Add a message to short-term memory
 */
export function addMessage(threadId: string, message: BaseMessage): void {
  const memory = getShortTermMemory(threadId);
  memory.messages.push(message);
  memory.lastUpdated = Date.now();

  // Trim if over limit
  if (memory.messages.length > MAX_MESSAGES) {
    memory.messages = memory.messages.slice(-MAX_MESSAGES);
  }
}

/**
 * Get recent messages from short-term memory
 */
export function getRecentMessages(threadId: string, limit: number = 10): BaseMessage[] {
  const memory = getShortTermMemory(threadId);
  return memory.messages.slice(-limit);
}

/**
 * Update working context (temporary data for current task)
 */
export function updateContext(threadId: string, key: string, value: any): void {
  const memory = getShortTermMemory(threadId);
  memory.workingContext[key] = value;
  memory.lastUpdated = Date.now();
}

/**
 * Get working context value
 */
export function getContext(threadId: string, key: string): any {
  const memory = getShortTermMemory(threadId);
  return memory.workingContext[key];
}

/**
 * Clear short-term memory for a thread
 */
export function clearMemory(threadId: string): void {
  memoryStore.delete(threadId);
}

/**
 * Clean up expired memories
 */
export function cleanupExpiredMemories(): number {
  const now = Date.now();
  let cleaned = 0;

  for (const [threadId, memory] of memoryStore.entries()) {
    if (now - memory.lastUpdated > MAX_AGE_MS) {
      memoryStore.delete(threadId);
      cleaned++;
    }
  }

  return cleaned;
}

/**
 * Get memory stats
 */
export function getMemoryStats(): {
  threadCount: number;
  totalMessages: number;
} {
  let totalMessages = 0;
  for (const memory of memoryStore.values()) {
    totalMessages += memory.messages.length;
  }

  return {
    threadCount: memoryStore.size,
    totalMessages,
  };
}
