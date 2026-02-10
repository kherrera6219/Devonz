import { z } from 'zod';

/**
 * Environment variable validation schema.
 * Required variables will cause startup to fail if missing.
 * Optional variables have sensible defaults.
 */
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Server
  PORT: z.string().optional().default('3000'),

  // LLM Provider API Keys (all optional - users configure what they need)
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  OPEN_ROUTER_API_KEY: z.string().optional(),
  MISTRAL_API_KEY: z.string().optional(),
  COHERE_API_KEY: z.string().optional(),
  DEEPSEEK_API_KEY: z.string().optional(),
  XAI_API_KEY: z.string().optional(),
  PERPLEXITY_API_KEY: z.string().optional(),
  HuggingFace_API_KEY: z.string().optional(),
  TOGETHER_API_KEY: z.string().optional(),
  HYPERBOLIC_API_KEY: z.string().optional(),

  // Service URLs
  OLLAMA_API_BASE_URL: z.string().url().optional(),
  OPENAI_LIKE_API_BASE_URL: z.string().url().optional(),
  TOGETHER_API_BASE_URL: z.string().url().optional(),
  LMSTUDIO_API_BASE_URL: z.string().url().optional(),
  HYPERBOLIC_API_BASE_URL: z.string().url().optional(),

  // GitHub integration
  VITE_GITHUB_ACCESS_TOKEN: z.string().optional(),
  VITE_GITHUB_TOKEN_TYPE: z.enum(['classic', 'fine-grained']).optional(),

  // GitLab integration
  VITE_GITLAB_ACCESS_TOKEN: z.string().optional(),
  VITE_GITLAB_URL: z.string().url().optional().default('https://gitlab.com'),

  // Deployment integrations
  VITE_VERCEL_ACCESS_TOKEN: z.string().optional(),
  VITE_NETLIFY_ACCESS_TOKEN: z.string().optional(),

  // Supabase
  VITE_SUPABASE_URL: z.string().url().optional(),
  VITE_SUPABASE_ANON_KEY: z.string().optional(),

  // Security
  TRUSTED_PROXIES: z.string().optional().default('127.0.0.1,::1'),
  ALLOWED_ORIGINS: z.string().optional(),

  // Logging
  VITE_LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'none']).optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validate environment variables on startup.
 * Logs warnings for missing optional configs and throws for invalid values.
 */
export function validateEnv(): EnvConfig {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.issues.map(
      (issue) => `  - ${issue.path.join('.')}: ${issue.message}`,
    );

    console.error('Environment validation failed:');
    console.error(formatted.join('\n'));

    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Invalid environment configuration:\n${formatted.join('\n')}`);
    }

    console.warn('Continuing with defaults in non-production mode...');

    // Return with defaults applied where possible
    return envSchema.parse({
      ...process.env,
      NODE_ENV: process.env.NODE_ENV || 'development',
    });
  }

  // Log provider availability summary
  const providers = [
    ['Anthropic', result.data.ANTHROPIC_API_KEY],
    ['OpenAI', result.data.OPENAI_API_KEY],
    ['Google', result.data.GOOGLE_GENERATIVE_AI_API_KEY],
    ['Groq', result.data.GROQ_API_KEY],
  ];

  const configured = providers.filter(([, key]) => !!key).map(([name]) => name);

  if (configured.length > 0) {
    console.log(`Configured LLM providers: ${configured.join(', ')}`);
  } else {
    console.warn('No LLM provider API keys configured. Users must set keys via the UI.');
  }

  return result.data;
}
