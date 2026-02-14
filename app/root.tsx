import { useStore } from '@nanostores/react';
import type { LinksFunction } from '@remix-run/node';
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useRouteError, isRouteErrorResponse } from '@remix-run/react';
import tailwindReset from '@unocss/reset/tailwind-compat.css?url';
import { themeStore } from './lib/stores/theme';
import { stripIndents } from './utils/stripIndent';
import { useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ClientOnly } from 'remix-utils/client-only';
import { cssTransition, ToastContainer } from 'react-toastify';
import { I18nextProvider } from 'react-i18next';
import { IconButton } from '~/components/ui/IconButton';
import './lib/i18n/config';

import reactToastifyStyles from 'react-toastify/dist/ReactToastify.css?url';
import globalStyles from './styles/index.scss?url';
import liquidMetalStyles from './styles/liquid-metal.css?url';
import xtermStyles from '@xterm/xterm/css/xterm.css?url';

import 'virtual:uno.css';

const toastAnimation = cssTransition({
  enter: 'animated fadeInRight',
  exit: 'animated fadeOutRight',
});

export const links: LinksFunction = () => [
  {
    rel: 'icon',
    href: '/favicon.svg',
    type: 'image/svg+xml',
  },
  { rel: 'stylesheet', href: reactToastifyStyles },
  { rel: 'stylesheet', href: tailwindReset },
  { rel: 'stylesheet', href: globalStyles },
  { rel: 'stylesheet', href: liquidMetalStyles },
  { rel: 'stylesheet', href: xtermStyles },
];

const inlineThemeCode = stripIndents`
  setTutorialKitTheme();

  function setTutorialKitTheme() {
    let theme = localStorage.getItem('devonz_theme');

    if (!theme) {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    document.querySelector('html')?.setAttribute('data-theme', theme);
  }
`;

// Head is now integrated into Layout for standard Remix hydration

export function Layout({ children }: { children: React.ReactNode }) {
  const theme = useStore(themeStore);

  useEffect(() => {
    document.querySelector('html')?.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <html lang="en" data-theme={theme}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <script dangerouslySetInnerHTML={{ __html: inlineThemeCode }} />
      </head>
      <body>
        <I18nextProvider i18n={(window as any).i18next || undefined}>
          <DndProvider backend={HTML5Backend}>{children}</DndProvider>
        </I18nextProvider>
        <ToastContainer
          closeButton={({ closeToast }: { closeToast: (e: React.MouseEvent<HTMLElement>) => void }) => (
            <IconButton
              onClick={(e) => closeToast(e as any)}
              title="Close Toast"
              className="text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary"
            >
              <div className="i-ph:x" />
            </IconButton>
          )}
          icon={({ type }: { type: string }) => {
            switch (type) {
              case 'success': {
                return <div className="i-ph:check-bold text-bolt-elements-icon-success text-2xl" />;
              }
              case 'error': {
                return <div className="i-ph:warning-circle-bold text-bolt-elements-icon-error text-2xl" />;
              }
            }

            return undefined;
          }}
          position="bottom-right"
          pauseOnFocusLoss
          transition={toastAnimation}
          autoClose={3000}
        />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

import { logStore } from './lib/stores/logs';

export function ErrorBoundary() {
  const error = useRouteError();
  console.error(error);

  let message = 'An unexpected error occurred';
  let details = 'Please try reloading the page.';

  if (isRouteErrorResponse(error)) {
    message = `${error.status} ${error.statusText}`;
    details = error.data;
  } else if (import.meta.env.DEV && error instanceof Error) {
    message = 'Application Error';
    details = error.message;
  } else if (error instanceof Error) {
    message = 'Application Error';
    details = 'An unexpected error occurred. Please try again later.';
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen w-full gap-4 p-4">
      <div className="i-ph:warning-circle-bold text-6xl text-bolt-elements-icon-error" />
      <h1 className="text-2xl font-bold">{message}</h1>
      <p className="text-bolt-elements-textSecondary max-w-lg text-center font-mono text-sm bg-bolt-elements-background-depth-3 p-4 rounded border border-bolt-elements-borderColor">
        {details}
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text rounded hover:bg-bolt-elements-button-primary-backgroundHover transition-colors"
        aria-label="Reload Application"
      >
        Reload Application
      </button>
    </div>
  );
}

export default function App() {
  const theme = useStore(themeStore);

  useEffect(() => {
    logStore.logSystem('Application initialized', {
      theme,
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    });

    // Initialize debug logging
    import('./utils/debugLogger')
      .then(({ debugLogger }) => {
        const status = debugLogger.getStatus();
        logStore.logSystem('Debug logging ready', {
          initialized: status.initialized,
          capturing: status.capturing,
          enabled: status.enabled,
        });
      })
      .catch((error) => {
        logStore.logError('Failed to initialize debug logging', error);
      });
  }, []);

  return (
    <ClientOnly fallback={<Outlet />}>
      {() => (
        <DndProvider backend={HTML5Backend}>
          <Outlet />
        </DndProvider>
      )}
    </ClientOnly>
  );
}
