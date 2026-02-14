import { useRouteError, isRouteErrorResponse, useNavigate } from '@remix-run/react';
import { useTranslation } from 'react-i18next';
import { Button } from '~/components/ui/Button';

export function RouteErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();
  const { t } = useTranslation();

  let message = t('common.error.unexpected', 'An unexpected error occurred');
  let details = t('common.error.retry_message', 'Please try reloading the page.');

  // Technical details for developers (hidden in production unless specific)
  let technicalDetails: string | null = null;

  if (isRouteErrorResponse(error)) {
    message = `${error.status} ${error.statusText}`;
    details = error.data;
  } else if (import.meta.env.DEV && error instanceof Error) {
    message = 'Application Error';
    details = error.message;
    technicalDetails = error.stack || null;
  } else if (error instanceof Error) {
    message = 'Application Error';
    details = t('common.error.unexpected_detailed', 'An unexpected error occurred. Please try again later.');
  }

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] w-full gap-6 p-8 text-center bg-bolt-elements-background-depth-1 rounded-lg border border-bolt-elements-borderColor shadow-sm">
      <div className="i-ph:warning-octagon-fill text-6xl text-bolt-elements-icon-error animate-pulse" />

      <div className="space-y-2 max-w-md">
        <h1 className="text-2xl font-bold text-bolt-elements-textPrimary">{message}</h1>
        <p className="text-bolt-elements-textSecondary text-sm leading-relaxed">
          {details}
        </p>
      </div>

      {technicalDetails && (
        <div className="w-full max-w-2xl mt-4 p-4 bg-bolt-elements-terminals-background rounded-md text-left overflow-x-auto border border-bolt-elements-borderColor/50">
          <code className="text-xs font-mono text-bolt-elements-code-text whitespace-pre-wrap">
            {technicalDetails}
          </code>
        </div>
      )}

      <div className="flex gap-4 mt-2">
        <Button
          variant="secondary"
          onClick={() => navigate(-1)}
        >
          {t('common.go_back', 'Go Back')}
        </Button>
        <Button
          variant="primary"
          onClick={() => window.location.reload()}
        >
          {t('common.reload', 'Reload Page')}
        </Button>
      </div>
    </div>
  );
}
