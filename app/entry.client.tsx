import { RemixBrowser } from '@remix-run/react';
import { startTransition, StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';

console.log('[Entry] Client entry point starting...');

if (typeof window !== 'undefined') {
  console.log('[Entry] Window environment detected');

  window.addEventListener('error', (event) => {
    console.error('[Global Error]:', event.error);
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('[Unhandled Rejection]:', event.reason);
  });
}

import { logStore } from '~/lib/stores/logs';

startTransition(() => {
  const rootElement = document;

  try {
    hydrateRoot(
      rootElement,
      <StrictMode>
        <RemixBrowser />
      </StrictMode>,
      {
        onRecoverableError: (error: any) => {
          console.error('[Hydration] Recoverable error:', error);

          // Attempt to log to our internal store if possible
          try {
            logStore.logError('Hydration recoverable error', error);
          } catch {
            // LogStore might not be available yet
          }
        },
      },
    );
  } catch (error) {
    console.error('[Entry] Hydration critical failure:', error);

    try {
      logStore.logError('Hydration critical failure', error as Error);
    } catch {
      // LogStore might not be available yet
    }
  }
});
