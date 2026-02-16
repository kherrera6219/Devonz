import { runtimeConfig } from '~/lib/runtime/config';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('StoreMiddleware');

/**
 * Frontend State Governance Middleware.
 * Wraps store actions to provide logging, debugging, and potential centralized control.
 */

/**
 * Middleware for the Nanostores state management.
 * Injects the runtimeConfig into the store updates.
 */
export const storeMiddleware = (store: { listen: (cb: (value: unknown, changed?: unknown) => void) => void }) => {
  store.listen((_value: unknown, _changed: unknown) => {
    // Logic to enrich or intercept state updates using runtimeConfig
    if (runtimeConfig.isDevelopment) {
      // logger.debug('Store update:', _value);
    }
  });
};

export function createAction<T extends unknown[]>(
  storeName: string,
  actionName: string,
  action: (...args: T) => void,
): (...args: T) => void {
  return (...args: T) => {
    if (runtimeConfig.isDevelopment) {
      logger.debug(`[State] ${storeName}/${actionName}`, { payload: args });
    }

    try {
      action(...args);
    } catch (error) {
      logger.error(`[State] Error in ${storeName}/${actionName}:`, error);

      // Could also report to ErrorReporter here
      throw error;
    }
  };
}

/**
 * Example usage:
 *
 * export const myStore = map({});
 *
 * export const updateValue = createAction('myStore', 'updateValue', (val) => {
 *   myStore.setKey('value', val);
 * });
 */
