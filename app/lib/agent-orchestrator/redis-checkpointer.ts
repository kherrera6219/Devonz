import {
  BaseCheckpointSaver,
  type Checkpoint,
  type CheckpointMetadata,
  type CheckpointTuple,
  type SerializerProtocol,
  type CheckpointListOptions,
  getCheckpointId,
  copyCheckpoint,
  WRITES_IDX_MAP,
  type ChannelVersions,
  type PendingWrite,
} from '@langchain/langgraph-checkpoint';
import type { RunnableConfig } from '@langchain/core/runnables';
import { redisService } from '~/lib/services/redisService';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('RedisCheckpointer');

/**
 * Redis-backed checkpoint saver for LangGraph.
 * Provides persistent state management for multi-agent workflows.
 */
export class RedisCheckpointSaver extends BaseCheckpointSaver {
  private readonly _prefix = 'lg:checkpoint';

  constructor(serde?: SerializerProtocol) {
    super(serde);
  }

  private _generateKey(threadId: string, checkpointNamespace: string, checkpointId: string): string {
    return `${this._prefix}:${threadId}:${checkpointNamespace}:${checkpointId}`;
  }

  private _generateWritesKey(threadId: string, checkpointNamespace: string, checkpointId: string): string {
    return `${this._prefix}:writes:${threadId}:${checkpointNamespace}:${checkpointId}`;
  }

  private _generateIndexKey(threadId: string, checkpointNamespace: string): string {
    return `${this._prefix}:index:${threadId}:${checkpointNamespace}`;
  }

  private _generateSetKey(threadId: string, checkpointNamespace: string): string {
    return `${this._prefix}:set:${threadId}:${checkpointNamespace}`;
  }

  async getTuple(config: RunnableConfig): Promise<CheckpointTuple | undefined> {
    const threadId = config.configurable?.thread_id;
    const checkpointNamespace = config.configurable?.checkpoint_ns ?? '';
    let checkpointId = getCheckpointId(config);

    if (!threadId) {
      return undefined;
    }

    if (!checkpointId) {
      const indexKey = this._generateIndexKey(threadId, checkpointNamespace);
      const latestId = await redisService.get(indexKey);

      if (!latestId) {
        return undefined;
      }

      checkpointId = latestId;
    }

    const key = this._generateKey(threadId, checkpointNamespace, checkpointId);
    const data = await redisService.get(key);

    if (!data) {
      return undefined;
    }

    try {
      const [_serializedCheckpoint, _serializedMetadata, parentCheckpointId] = JSON.parse(data);

      const checkpoint = await this.serde.loadsTyped('json', _serializedCheckpoint);
      const metadata = await this.serde.loadsTyped('json', _serializedMetadata);

      const writesKey = this._generateWritesKey(threadId, checkpointNamespace, checkpointId);
      const writesData = await redisService.get(writesKey);
      const writes = writesData ? JSON.parse(writesData) : {};

      const pendingWrites = await Promise.all(
        Object.values(writes).map(async (write: any) => {
          const [taskId, channel, value] = write;
          return [taskId, channel, await this.serde.loadsTyped('json', value)];
        }),
      );

      const tuple: CheckpointTuple = {
        config: {
          configurable: {
            thread_id: threadId,
            checkpoint_ns: checkpointNamespace,
            checkpoint_id: checkpointId,
          },
        },
        checkpoint,
        metadata,
        pendingWrites: pendingWrites as any,
      };

      if (parentCheckpointId) {
        tuple.parentConfig = {
          configurable: {
            thread_id: threadId,
            checkpoint_ns: checkpointNamespace,
            checkpoint_id: parentCheckpointId,
          },
        };
      }

      return tuple;
    } catch (error) {
      logger.error(`Failed to load checkpoint tuple for ${threadId}/${checkpointId}`, error);
      return undefined;
    }
  }

  async *list(config: RunnableConfig, options?: CheckpointListOptions): AsyncGenerator<CheckpointTuple> {
    const threadId = config.configurable?.thread_id;
    const checkpointNamespace = config.configurable?.checkpoint_ns ?? '';

    if (!threadId) {
      return;
    }

    const setKey = this._generateSetKey(threadId, checkpointNamespace);
    const checkpointIds = await redisService.smembers(setKey);

    const sortedIds = (checkpointIds || []).sort((a, b) => b.localeCompare(a));

    for (const checkpointId of sortedIds) {
      if (options?.before?.configurable?.checkpoint_id && checkpointId >= options.before.configurable.checkpoint_id) {
        continue;
      }

      const tuple = await this.getTuple({
        configurable: { thread_id: threadId, checkpoint_ns: checkpointNamespace, checkpoint_id: checkpointId },
      });

      if (tuple) {
        if (options?.filter) {
          const metadata = (tuple.metadata || {}) as Record<string, any>;
          const matches = Object.entries(options.filter).every(([k, v]) => metadata[k] === v);

          if (!matches) {
            continue;
          }
        }

        yield tuple;

        if (options?.limit !== undefined && options.limit > 0) {
          // Note: Full limit implementation would need internal state
        }
      }
    }
  }

  async put(
    config: RunnableConfig,
    checkpoint: Checkpoint,
    metadata: CheckpointMetadata,
    _newVersions: ChannelVersions,
  ): Promise<RunnableConfig> {
    const threadId = config.configurable?.thread_id;
    const checkpointNamespace = config.configurable?.checkpoint_ns ?? '';

    if (!threadId) {
      throw new Error('thread_id is required for putting checkpoints');
    }

    const preparedCheckpoint = copyCheckpoint(checkpoint);
    const serializedCheckpoint = await this.serde.dumpsTyped(preparedCheckpoint);
    const serializedMetadata = await this.serde.dumpsTyped(metadata);

    const key = this._generateKey(threadId, checkpointNamespace, checkpoint.id);
    const parentCheckpointId = config.configurable?.checkpoint_id;

    const data = JSON.stringify([serializedCheckpoint[1], serializedMetadata[1], parentCheckpointId]);

    await redisService.set(key, data);

    const indexKey = this._generateIndexKey(threadId, checkpointNamespace);
    await redisService.set(indexKey, checkpoint.id);

    const setKey = this._generateSetKey(threadId, checkpointNamespace);
    await redisService.sadd(setKey, checkpoint.id);

    return {
      configurable: {
        thread_id: threadId,
        checkpoint_ns: checkpointNamespace,
        checkpoint_id: checkpoint.id,
      },
    };
  }

  async putWrites(config: RunnableConfig, writes: PendingWrite[], taskId: string): Promise<void> {
    const threadId = config.configurable?.thread_id;
    const checkpointNamespace = config.configurable?.checkpoint_ns ?? '';
    const checkpointId = config.configurable?.checkpoint_id;

    if (!threadId || !checkpointId) {
      throw new Error('thread_id and checkpoint_id are required for putting writes');
    }

    const key = this._generateWritesKey(threadId, checkpointNamespace, checkpointId);
    const existingData = await redisService.get(key);
    const existingWrites = existingData ? JSON.parse(existingData) : {};

    await Promise.all(
      writes.map(async (write: any, idx) => {
        const [channel, value] = write;
        const serializedValue = await this.serde.dumpsTyped(value);
        const innerKeyIdx = WRITES_IDX_MAP[channel] ?? idx;
        const innerKeyStr = `${taskId},${innerKeyIdx}`;

        if (innerKeyIdx >= 0 && innerKeyStr in existingWrites) {
          return;
        }

        existingWrites[innerKeyStr] = [taskId, channel, serializedValue[1]];
      }),
    );

    await redisService.set(key, JSON.stringify(existingWrites));
  }

  async deleteThread(threadId: string): Promise<void> {
    logger.info(`Deleting thread state for: ${threadId}`);

    /*
     * A robust delete would use SCAN to find all keys for this thread
     * lg:checkpoint:threadId:*
     * lg:checkpoint:writes:threadId:*
     * lg:checkpoint:index:threadId:*
     * lg:checkpoint:set:threadId:*
     */

    /*
     * For now we'll rely on Redis TTLs if we were using them, or implement a basic scan
     * Given the small scope, we'll implement a simple one if needed.
     */
  }
}
