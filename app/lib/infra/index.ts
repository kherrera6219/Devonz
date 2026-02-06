
import type { EventLogEntry, RunState } from "../agent-orchestrator/types/mas-schemas";

/**
 * Infrastructure Interfaces
 *
 * These interfaces define the contracts for the underlying infrastructure
 * (Redis, Postgres, Object Storage) to decouple the agent logic from the storage implementation.
 */

// ==========================================
// 1. Event Bus (Redis Streams)
// ==========================================

export interface IEventBus {
  /**
   * Publish an event to the run's event stream
   */
  publishEvent(runId: string, event: EventLogEntry): Promise<void>;

  /**
   * Subscribe to events for a specific run
   */
  subscribeToRun(runId: string, callback: (event: EventLogEntry) => void): Promise<() => void>;

  /**
   * Publish a transient "live" status update (heartbeat/progress)
   * These are typically not persisted permanently in the event log
   */
  publishStatus(runId: string, status: any): Promise<void>;
}

// ==========================================
// 2. State Store (Postgres / Checkpoints)
// ==========================================

export interface IStateStore {
  /**
   * Load the latest state for a run
   */
  loadState(runId: string): Promise<RunState | null>;

  /**
   * Save a checkpoint of the state
   */
  saveState(runId: string, state: RunState): Promise<void>;

  /**
   * Initialize a new run
   */
  createRun(runId: string, initialState: RunState): Promise<void>;
}

// ==========================================
// 3. Artifact Store (Object Storage / S3)
// ==========================================

export interface IArtifactStore {
  /**
   * Upload a file or bundle
   * Returns a reference ID or signed URL
   */
  uploadArtifact(runId: string, key: string, content: Buffer | string): Promise<string>;

  /**
   * Get a download URL for an artifact
   */
  getDownloadUrl(runId: string, key: string): Promise<string>;
}
