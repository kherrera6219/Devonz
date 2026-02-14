import { RemixBrowser } from '@remix-run/react';
import { startTransition, StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';

import { errorReporter } from '~/lib/services/errorReporter';

console.log('[Entry] Client entry point starting...');

if (typeof window !== 'undefined') {
  console.log('[Entry] Window environment detected');
  // Initialize centralized error reporting
  errorReporter.init();
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
          errorReporter.report({
            message: 'Hydration recoverable error',
            stack: error?.stack,
            source: 'hydration-recoverable',
            severity: 'warning',
            metadata: { originalError: error },
          });
        },
      },
    );
  } catch (error) {
    errorReporter.report({
      message: 'Hydration critical failure',
      stack: (error as Error)?.stack,
      source: 'hydration-critical',
      severity: 'fatal',
      metadata: { originalError: error },
    });
  }
});
