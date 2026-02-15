import { runtimeConfig } from '~/lib/runtime/config';

/**
 * Frontend State Governance Middleware.
 * Wraps store actions to provide logging, debugging, and potential centralized control.
 */

/**
 * Middleware for the Nanostores state management.
 * Injects the runtimeConfig into the store updates.
 */
export const storeMiddleware = (store: any) => {
  store.listen((_value: any, _changed: any) => {
    // Logic to enrich or intercept state updates using runtimeConfig
    if (runtimeConfig.isDevelopment) {
      // console.log('Store update:', value);
    }
  });
};

export function createAction<T extends any[]>(
  storeName: string,
  actionName: string,
  action: (...args: T) => void,
): (...args: T) => void {
  return (...args: T) => {
    if (runtimeConfig.isDevelopment) {
      console.groupCollapsed(`[State] ${storeName}/${actionName}`);
      console.log('Payload:', args);
      console.groupEnd();
    }

    try {
      action(...args);
    } catch (error) {
      console.error(`[State] Error in ${storeName}/${actionName}:`, error);

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
