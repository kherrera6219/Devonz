import { createScopedLogger } from '~/utils/logger';
import { redisService } from '~/lib/services/redisService';

const logger = createScopedLogger('StartupValidator');

/**
 * Operations Subsystem: Deterministic Startup Validation
 * Verifies that all essential services are ready before processing requests.
 */
export class StartupValidator {
  private static _instance: StartupValidator;

  private constructor() {
    // Singleton
  }

  static getInstance(): StartupValidator {
    if (!StartupValidator._instance) {
      StartupValidator._instance = new StartupValidator();
    }

    return StartupValidator._instance;
  }

  /**
   * Validates the entire application stack.
   */
  async validate(): Promise<boolean> {
    logger.info('Starting deterministic startup validation...');

    const checks = [
      { name: 'Redis', check: () => redisService.isConnected },
      { name: 'Environment', check: () => !!process.env.APP_SECRET },

      // Add more checks (DB, LLM API, etc.)
    ];

    let allPassed = true;

    for (const { name, check } of checks) {
      try {
        const passed = await check();

        if (passed) {
          logger.info(`Startup Check: ${name} [PASS]`);
        } else {
          logger.error(`Startup Check: ${name} [FAIL]`);
          allPassed = false;
        }
      } catch (error) {
        logger.error(`Startup Check: ${name} [ERROR]`, error);
        allPassed = false;
      }
    }

    if (allPassed) {
      logger.info('Startup Validation Complete: HEALTHY');
    } else {
      logger.error('Startup Validation Complete: DEGRADED');
    }

    return allPassed;
  }
}

export const startupValidator = StartupValidator.getInstance();
