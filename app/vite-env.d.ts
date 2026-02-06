declare const __COMMIT_HASH: string;
declare const __APP_VERSION: string;

/**
 * Cloudflare Workers environment type.
 * Used by LLM providers to access environment variables in serverless context.
 */
declare interface Env {
  [key: string]: string | undefined;
}

/**
 * Cloudflare context type for API routes.
 */
declare interface CloudflareContext {
  env: Env;
  cf?: IncomingRequestCfProperties;
  ctx?: ExecutionContext;
}
