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
        },
      },
    );
  } catch (error) {
    console.error('[Entry] Hydration failed to initiate:', error);
  }
});
