import { map } from 'nanostores';
import type { MapStore, WritableAtom } from 'nanostores';
import { RuntimeConfig } from '~/lib/runtime/config';

/**
 * Frontend State Governance Middleware.
 * Wraps store actions to provide logging, debugging, and potential centralized control.
 */

export function createAction<T extends any[]>(
  storeName: string,
  actionName: string,
  action: (...args: T) => void
): (...args: T) => void {

  return (...args: T) => {
    if (RuntimeConfig.isDevelopment) {
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
