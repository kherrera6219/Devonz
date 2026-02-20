import { useStore } from '@nanostores/react';
import type { LinksFunction } from '@remix-run/node';
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from '@remix-run/react';
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
import { RouteErrorBoundary } from '~/components/errors/RouteErrorBoundary';
import { FeatureProvider } from '~/lib/modules/features/FeatureContext';
import { logStore } from './lib/stores/logs';
import i18n from './lib/i18n/config';

import reactToastifyStyles from 'react-toastify/dist/ReactToastify.css?url';
import globalStyles from './styles/index.scss?url';
import liquidMetalStyles from './styles/liquid-metal.css?url';
import xtermStyles from '@xterm/xterm/css/xterm.css?url';

import 'virtual:uno.css';

import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

export async function loader({ request }: LoaderFunctionArgs) {
  const cookieHeader = request.headers.get('Cookie');
  let csrfToken: string | undefined;

  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc: Record<string, string>, c: string) => {
      const [key, value] = c.trim().split('=');

      if (key) {
        acc[key] = value;
      }

      return acc;
    }, {});
    csrfToken = cookies.csrf_token;
  }

  const newSession = !csrfToken;

  if (newSession) {
    const { generateCsrfToken } = await import('~/lib/csrf.server');
    csrfToken = generateCsrfToken();
  }

  return json(
    {
      csrfToken,
      ENV: {
        CSRF_TOKEN: csrfToken,
      },
    },
    {
      headers: newSession
        ? {
            'Set-Cookie': `csrf_token=${csrfToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`,
          }
        : undefined,
    },
  );
}

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
  const data = useLoaderData<typeof loader>();

  useEffect(() => {
    document.querySelector('html')?.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <html lang="en" data-theme={theme}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {data?.csrfToken && <meta name="csrf-token" content={data.csrfToken} />}
        <Meta />
        <Links />
        <script dangerouslySetInnerHTML={{ __html: inlineThemeCode }} />
      </head>
      <body>
        <I18nextProvider i18n={(window as unknown as { i18next?: typeof import('i18next').default }).i18next || i18n}>
          {children}
        </I18nextProvider>
        <ToastContainer
          closeButton={({ closeToast }: { closeToast: (e: React.MouseEvent<HTMLElement>) => void }) => (
            <IconButton
              onClick={(e) => closeToast(e as unknown as React.MouseEvent<HTMLElement>)}
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
        {data?.ENV && (
          <script
            dangerouslySetInnerHTML={{
              __html: `window.ENV = ${JSON.stringify(data.ENV).replace(/</g, '\\u003c')}`,
            }}
          />
        )}
        <Scripts />
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-bolt-elements-background-depth-1">
      <RouteErrorBoundary />
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
        <FeatureProvider>
          <DndProvider backend={HTML5Backend}>
            <Outlet />
          </DndProvider>
        </FeatureProvider>
      )}
    </ClientOnly>
  );
}
