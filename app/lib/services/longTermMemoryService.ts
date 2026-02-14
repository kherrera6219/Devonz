import { promises as fs } from 'fs';
import path from 'path';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('LongTermMemory');

export interface MemoryEntry {
  category: 'CHECKPOINT' | 'DECISION' | 'USER_PREFERENCE' | 'ARCH_PATTERN' | 'CONTEXT';
  content: string;
  timestamp: string;
}

export class LongTermMemoryService {
  private static _instance: LongTermMemoryService;
  private readonly _memoryDir = '.devonz';
  private readonly _memoryFile = 'MEMORY.md';

  private constructor() {}

  static getInstance(): LongTermMemoryService {
    if (!LongTermMemoryService._instance) {
      LongTermMemoryService._instance = new LongTermMemoryService();
    }
    return LongTermMemoryService._instance;
  }

  /**
   * Initializes the memory file if it doesn't exist
   */
  async initialize(projectRoot: string): Promise<void> {
    const dirPath = path.join(projectRoot, this._memoryDir);
    const filePath = path.join(dirPath, this._memoryFile);

    try {
      await fs.mkdir(dirPath, { recursive: true });

      try {
        await fs.access(filePath);
      } catch {
        // Create header if file doesn't exist
        const header = `# Project Memory
> This file is maintained by Devonz. It stores critical architectural decisions, user preferences, and project context.
> You can edit this file to guide future agent behaviors.

## Current Context
- **Last Updated**: ${new Date().toISOString()}

## Architectural Patterns
<!-- Add patterns here -->

## User Preferences
<!-- Add preferences here -->

## Decision Log
<!-- Append decisions here -->
`;
        await fs.writeFile(filePath, header, 'utf-8');
        logger.info(`Initialized project memory at ${filePath}`);
      }
    } catch (error) {
      logger.error('Failed to initialize long-term memory', error);
      throw error;
    }
  }

  /**
   * Appends a new memory entry to the log
   */
  async addEntry(projectRoot: string, entry: MemoryEntry): Promise<void> {
    const filePath = path.join(projectRoot, this._memoryDir, this._memoryFile);

    const formattedEntry = `
### [${entry.category}] ${entry.timestamp}
${entry.content}
`;

    try {
      // Robust append: Read, verify section, append.
      // For MVP, we just append to the end.
      await fs.appendFile(filePath, formattedEntry, 'utf-8');
      logger.info(`Added memory entry: [${entry.category}]`);
    } catch (error) {
      logger.error('Failed to write memory entry', error);
    }
  }

  /**
   * Reads the entire memory context to inject into Agent Prompt
   */
  async getMemoryContext(projectRoot: string): Promise<string> {
    const filePath = path.join(projectRoot, this._memoryDir, this._memoryFile);

    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      logger.warn('Memory file not found, returning empty context');
      return '';
    }
  }
}

export const longTermMemory = LongTermMemoryService.getInstance();
