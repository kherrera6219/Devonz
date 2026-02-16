import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('SchemaParity');

interface SchemaField {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  index?: boolean;
}

interface TableSchema {
  fields: Record<string, SchemaField>;
  keyPath: string;
}

/**
 * Data Layer: Schema Parity Validation
 * Ensures consistency between local persistence (IndexedDB) and cloud layers (Postgres).
 */
export class SchemaParityService {
  private static _instance: SchemaParityService;

  private readonly _goldenSchema: Record<string, TableSchema> = {
    chats: {
      keyPath: 'id',
      fields: {
        id: { type: 'string', required: true, index: true },
        urlId: { type: 'string', required: true, index: true },
        messages: { type: 'array', required: true },
        description: { type: 'string', required: false },
        timestamp: { type: 'string', required: true, index: true },
        metadata: { type: 'object', required: false },
      },
    },
    snapshots: {
      keyPath: 'chatId',
      fields: {
        chatId: { type: 'string', required: true },
        snapshot: { type: 'object', required: true },
        signature: { type: 'string', required: false }, // For integrity
      },
    },
  };

  private constructor() {
    // Singleton
  }

  static getInstance(): SchemaParityService {
    if (!SchemaParityService._instance) {
      SchemaParityService._instance = new SchemaParityService();
    }

    return SchemaParityService._instance;
  }

  /**
   * Validates a record against the golden schema for a given table.
   */
  validateRecord(tableName: string, record: any): { valid: boolean; errors: string[] } {
    const table = this._goldenSchema[tableName];

    if (!table) {
      return { valid: false, errors: [`Table '${tableName}' not found in golden schema.`] };
    }

    const errors: string[] = [];

    for (const [fieldName, spec] of Object.entries(table.fields)) {
      const value = record[fieldName];

      if (value === undefined || value === null) {
        if (spec.required) {
          errors.push(`Missing required field: ${fieldName}`);
        }

        continue;
      }

      const actualType = Array.isArray(value) ? 'array' : typeof value;

      if (actualType !== spec.type) {
        errors.push(`Type mismatch for ${fieldName}: expected ${spec.type}, got ${actualType}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Checks for schema drift in a batch of records.
   */
  checkDrift(tableName: string, records: any[]): void {
    let driftCount = 0;

    for (const record of records) {
      const { valid, errors } = this.validateRecord(tableName, record);

      if (!valid) {
        driftCount++;
        logger.warn(`Schema drift in ${tableName} record ${record.id || 'unknown'}: ${errors.join(', ')}`);
      }
    }

    if (driftCount > 0) {
      logger.error(`Found schema drift in ${driftCount} records in ${tableName}`);
    } else {
      logger.info(`Schema parity verified for ${tableName} (${records.length} records)`);
    }
  }
}

export const schemaParityService = SchemaParityService.getInstance();
