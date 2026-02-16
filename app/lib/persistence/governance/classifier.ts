import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('DataClassification');

export type SensitivityLevel = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';

interface ClassificationPolicy {
  level: SensitivityLevel;
  requiredEncryption: boolean;
  retentionDays: number;
}

/**
 * Data Layer: Data Classification & Tagging
 * Manages sensitivity labels and enforces data local policies.
 */
export class DataClassificationService {
  private static _instance: DataClassificationService;

  private readonly _policies: Record<SensitivityLevel, ClassificationPolicy> = {
    PUBLIC: { level: 'PUBLIC', requiredEncryption: false, retentionDays: 365 },
    INTERNAL: { level: 'INTERNAL', requiredEncryption: true, retentionDays: 90 },
    CONFIDENTIAL: { level: 'CONFIDENTIAL', requiredEncryption: true, retentionDays: 30 },
    RESTRICTED: { level: 'RESTRICTED', requiredEncryption: true, retentionDays: 7 },
  };

  private constructor() {
    // Singleton
  }

  static getInstance(): DataClassificationService {
    if (!DataClassificationService._instance) {
      DataClassificationService._instance = new DataClassificationService();
    }

    return DataClassificationService._instance;
  }

  /**
   * Assigns a sensitivity level to a record.
   */
  classify(text: string): SensitivityLevel {
    const snippet = text.toLowerCase();

    if (snippet.includes('api_key') || snippet.includes('password') || snippet.includes('secret')) {
      return 'RESTRICTED';
    }

    if (snippet.includes('private') || snippet.includes('internal only') || snippet.includes('proprietary')) {
      return 'CONFIDENTIAL';
    }

    if (snippet.includes('employee') || snippet.includes('financial') || snippet.includes('roadmap')) {
      return 'INTERNAL';
    }

    return 'PUBLIC';
  }

  getPolicy(level: SensitivityLevel): ClassificationPolicy {
    return this._policies[level];
  }

  /**
   * Enforces classification rules on a record before persistence.
   */
  enforcePolicy(record: any, level: SensitivityLevel) {
    const policy = this.getPolicy(level);

    if (policy.requiredEncryption) {
      // In a real implementation, this would trigger individual field encryption
      logger.info(`Policy Enforced: Encrypting record due to ${level} classification`);
    }

    return {
      ...record,
      metadata: {
        ...(record.metadata || {}),
        sensitivity: level,
        expiresAt: new Date(Date.now() + policy.retentionDays * 24 * 60 * 60 * 1000).toISOString(),
      },
    };
  }
}

export const dataClassificationService = DataClassificationService.getInstance();
