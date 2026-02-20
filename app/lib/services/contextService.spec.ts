// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ContextService } from './contextService';
import { redisService } from './redisService';
import { RAGService } from './ragService';
import * as createSummaryModule from '~/lib/.server/llm/create-summary';
import * as selectContextModule from '~/lib/.server/llm/select-context';

// Mock dependencies
vi.mock('./redisService');
vi.mock('./ragService');
vi.mock('~/lib/.server/llm/create-summary');
vi.mock('~/lib/.server/llm/select-context');
vi.mock('~/utils/logger', () => ({
  createScopedLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('ContextService', () => {
  let contextService: ContextService;
  const mockDataStream = {
    writeData: vi.fn(),
    writeMessageAnnotation: vi.fn(),
    write: vi.fn(),
    writeSource: vi.fn(),
    merge: vi.fn(),
    onError: vi.fn(),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    contextService = ContextService.getInstance();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('prepareContext', () => {
    const defaultOptions = {
      messages: [{ id: '1', role: 'user' as const, content: 'test message' }],
      files: { 'file1.ts': { type: 'file' as const, content: 'content', isBinary: false } },
      promptId: 'default',
      contextOptimization: true,
      apiKeys: {},
      providerSettings: {},
      context: {},
      dataStream: mockDataStream,
      cumulativeUsage: { completionTokens: 0, promptTokens: 0, totalTokens: 0 },
    };

    it('should skip context optimization if disabled', async () => {
      vi.mocked(selectContextModule.getFilePaths).mockReturnValue(['file1.ts']);

      const result = await contextService.prepareContext({
        ...defaultOptions,
        contextOptimization: false,
      });

      expect(result).toEqual({ summary: undefined, filteredFiles: undefined });
      expect(mockDataStream.writeData).not.toHaveBeenCalled();
    });

    it('should use cached summary if available', async () => {
      vi.mocked(selectContextModule.getFilePaths).mockReturnValue(['file1.ts']);
      vi.mocked(redisService.get).mockResolvedValue('cached summary');
      vi.mocked(selectContextModule.selectContext).mockResolvedValue({
        'file1.ts': { type: 'file' as const, content: 'content', isBinary: false },
      } as any);

      const result = await contextService.prepareContext(defaultOptions as any);

      expect(redisService.get).toHaveBeenCalled();
      expect(createSummaryModule.createSummary).not.toHaveBeenCalled();
      expect(result.summary).toBe('cached summary');
      expect(mockDataStream.writeMessageAnnotation).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'chatSummary', summary: 'cached summary' }),
      );
    });

    it('should generate summary/cache it if not found', async () => {
      vi.mocked(selectContextModule.getFilePaths).mockReturnValue(['file1.ts']);
      vi.mocked(redisService.get).mockResolvedValue(null);
      vi.mocked(createSummaryModule.createSummary).mockResolvedValue('new summary');
      vi.mocked(selectContextModule.selectContext).mockResolvedValue({
        'file1.ts': { type: 'file' as const, content: 'content', isBinary: false },
      } as any);

      const result = await contextService.prepareContext(defaultOptions as any);

      expect(createSummaryModule.createSummary).toHaveBeenCalled();
      expect(redisService.set).toHaveBeenCalledWith(expect.stringContaining('summary:'), 'new summary', 3600);
      expect(result.summary).toBe('new summary');
    });

    it('should select context files', async () => {
      vi.mocked(selectContextModule.getFilePaths).mockReturnValue(['selected.ts']);
      vi.mocked(redisService.get).mockResolvedValue('summary');
      vi.mocked(selectContextModule.selectContext).mockResolvedValue({
        'selected.ts': { type: 'file' as const, content: 'content', isBinary: false },
      } as any);

      const result = await contextService.prepareContext(defaultOptions as any);

      expect(selectContextModule.selectContext).toHaveBeenCalled();
      expect(result.filteredFiles).toEqual({
        'selected.ts': { type: 'file' as const, content: 'content', isBinary: false },
      });
      expect(mockDataStream.writeMessageAnnotation).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'codeContext', files: ['selected.ts'] }),
      );
    });

    it('should query RAG and append to summary', async () => {
      vi.mocked(selectContextModule.getFilePaths).mockReturnValue(['file1.ts']);
      vi.mocked(redisService.get).mockResolvedValue('summary');
      vi.mocked(selectContextModule.selectContext).mockResolvedValue({} as any);

      const mockQuery = vi.fn().mockResolvedValue(['rag snippet']);

      // Mock the singleton behavior properly
      const ragInstance = { query: mockQuery };
      vi.spyOn(RAGService, 'getInstance').mockReturnValue(ragInstance as any);

      const result = await contextService.prepareContext(defaultOptions as any);

      expect(mockQuery).toHaveBeenCalled();
      expect(result.summary).toContain('Relevant Code Snippets from RAG');
      expect(result.summary).toContain('rag snippet');
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(selectContextModule.getFilePaths).mockReturnValue(['file1.ts']);
      vi.mocked(redisService.get).mockRejectedValue(new Error('Redis error'));
      vi.mocked(createSummaryModule.createSummary).mockRejectedValue(new Error('Summary error'));
      vi.mocked(selectContextModule.selectContext).mockRejectedValue(new Error('Select context error'));

      const mockQuery = vi.fn().mockRejectedValue(new Error('RAG error'));
      const ragInstance = { query: mockQuery };
      vi.spyOn(RAGService, 'getInstance').mockReturnValue(ragInstance as any);

      const result = await contextService.prepareContext(defaultOptions as any);

      // Should not throw, should return undefined/empty where appropriate
      expect(result.summary).toBeUndefined();
      expect(result.filteredFiles).toBeUndefined();
    });
  });
});
