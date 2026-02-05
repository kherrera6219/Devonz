import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GraphService } from './graphService';

// Mock neo4j-driver
const mocks = vi.hoisted(() => {
  const run = vi.fn();
  const session = {
    executeWrite: vi.fn((cb) => cb({ run })),
    executeRead: vi.fn((cb) => cb({ run })),
    close: vi.fn(),
  };
  const driver = {
    session: vi.fn(() => session),
    close: vi.fn(),
  };
  return { run, session, driver };
});

vi.mock('neo4j-driver', () => ({
  default: {
    driver: () => mocks.driver,
    auth: {
      basic: vi.fn(),
    },
    int: (val: number) => val,
  },
}));

describe('GraphService', () => {
  let graphService: GraphService;

  beforeEach(() => {
    vi.clearAllMocks();
    graphService = GraphService.getInstance();
  });

  it('should initialize correctly', () => {
    expect(graphService).toBeDefined();
  });

  describe('batch operations', () => {
    it('should handle empty batch files gracefully', async () => {
      await graphService.addFileNodesBatch('project-1', []);
      expect(mocks.session.executeWrite).not.toHaveBeenCalled();
    });

    it('should add files in batch', async () => {
      const files = [{ path: 'file1.ts' }, { path: 'file2.ts', metadata: { size: 100 } }];

      mocks.run.mockResolvedValueOnce({ records: [] });

      await graphService.addFileNodesBatch('project-1', files);

      expect(mocks.session.executeWrite).toHaveBeenCalled();
      const callArgs = mocks.run.mock.calls[0];
      const query = callArgs[0] as string;
      const params = callArgs[1] as any;

      expect(query).toContain('UNWIND $files as file');
      expect(params.projectId).toBe('project-1');
      expect(params.files).toHaveLength(2);
    });

    it('should handle empty batch dependencies gracefully', async () => {
      await graphService.addDependenciesBatch('project-1', []);
      expect(mocks.session.executeWrite).not.toHaveBeenCalled();
    });

    it('should add dependencies in batch', async () => {
      const deps = [{ sourcePath: 'file1.ts', targetPath: 'file2.ts' }];

      mocks.run.mockResolvedValueOnce({ records: [] });

      await graphService.addDependenciesBatch('project-1', deps);

      expect(mocks.session.executeWrite).toHaveBeenCalled();
      const callArgs = mocks.run.mock.calls[0];
      const query = callArgs[0] as string;
      const params = callArgs[1] as any;

      expect(query).toContain('UNWIND $dependencies as dep');
      expect(params.projectId).toBe('project-1');
      expect(params.dependencies[0].sourcePath).toBe('file1.ts');
    });
  });

  describe('error handling', () => {
    it('should propagate errors from neo4j driver', async () => {
      const error = new Error('Connection failed');
      mocks.session.executeWrite.mockRejectedValueOnce(error);

      await expect(graphService.addFileNode('p1', 'f1')).rejects.toThrow('Connection failed');
      expect(mocks.session.close).toHaveBeenCalled();
    });
  });
});
