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
  console.log('[Entry] Starting hydration...');

  const rootElement = document.getElementById('root');

  if (!rootElement) {
    console.error('[Entry] Root element not found!');
    return;
  }

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
    console.log('[Entry] Hydration call successfully initiated.');
  } catch (error) {
    console.error('[Entry] Hydration failed to initiate:', error);
  }
});
