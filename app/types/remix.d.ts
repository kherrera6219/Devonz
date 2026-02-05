/**
 * Remix / Cloudflare Module Augmentation
 *
 * Extends Remix's AppLoadContext to include Cloudflare Worker environment.
 * This allows TypeScript to recognize context.cloudflare.env in API routes.
 */

import '@remix-run/node';
import '@remix-run/cloudflare';

declare module '@remix-run/node' {
  interface AppLoadContext {
    cloudflare?: {
      env: Record<string, string | undefined>;
      cf?: IncomingRequestCfProperties;
      ctx?: ExecutionContext;
    };
  }
}

declare module '@remix-run/cloudflare' {
  interface AppLoadContext {
    cloudflare?: {
      env: Record<string, string | undefined>;
      cf?: IncomingRequestCfProperties;
      ctx?: ExecutionContext;
    };
  }
}
