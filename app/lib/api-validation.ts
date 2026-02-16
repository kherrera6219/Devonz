import { json } from '@remix-run/node';
import { z } from 'zod';

/**
 * Shared Zod schemas for API route input validation.
 */

// Chat API
export const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        id: z.string().optional(),
        role: z.enum(['user', 'assistant', 'system']),
        content: z.union([z.string(), z.array(z.record(z.unknown()))]),
      }),
    )
    .min(1, { message: 'At least one message is required' }),
  files: z.record(z.unknown()).optional().default({}),
  promptId: z.string().optional(),
  contextOptimization: z.boolean().default(false),
  chatMode: z.enum(['discuss', 'build']).default('build'),
  designScheme: z.record(z.unknown()).optional(),
  supabase: z
    .object({
      isConnected: z.boolean(),
      hasSelectedProject: z.boolean(),
      credentials: z
        .object({
          anonKey: z.string().optional(),
          supabaseUrl: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
  maxLLMSteps: z.number().int().min(1).max(50).default(3),
  agentMode: z.boolean().optional(),
  orchestratorMode: z.boolean().optional(),
});

// Enhancer API
export const enhancerRequestSchema = z.object({
  message: z.string().min(1).max(10000),
  model: z.string().min(1).optional(),
  provider: z.record(z.unknown()).optional(),
  apiKeys: z.record(z.string()).optional(),
});

// Bug report API
export const bugReportSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  steps: z.string().max(5000).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
});

// Supabase query
export const supabaseQuerySchema = z.object({
  sql: z.string().min(1).max(10000),
  projectId: z.string().optional(),
});

// LLM call
export const llmCallSchema = z.object({
  model: z.string().min(1),
  provider: z.string().min(1),
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string(),
      }),
    )
    .min(1),
  apiKeys: z.record(z.string()).optional(),
  options: z.record(z.unknown()).optional(),
});

// Knowledge API
export const knowledgeSchema = z.object({
  action: z.enum(['index', 'query', 'delete']),
  projectId: z.string().uuid(),
  content: z.record(z.string()).optional(),
  query: z.string().optional(),
});

// Vercel deploy
export const vercelDeploySchema = z.object({
  projectName: z.string().min(1).max(100),
  files: z.record(z.string()),
  framework: z.string().optional(),
  buildCommand: z.string().optional(),
  outputDirectory: z.string().optional(),
});

// Netlify deploy
export const netlifyDeploySchema = z.object({
  siteId: z.string().optional(),
  siteName: z.string().min(1).max(100).optional(),
  files: z.record(z.string()),
});

// Check env key
export const checkEnvKeySchema = z.object({
  key: z.string().min(1).max(100),
  provider: z.string().min(1).max(50),
});

// MCP update config
export const mcpUpdateConfigSchema = z.object({
  config: z.record(z.unknown()),
});

/**
 * Validate request body against a Zod schema.
 * Returns parsed data on success or a JSON error response on failure.
 */
export async function validateRequestBody<T extends z.ZodSchema>(
  request: Request,
  schema: T,
): Promise<{ data: z.infer<T>; error: null } | { data: null; error: Response }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));

      return {
        data: null,
        error: json({ error: 'Validation failed', details: errors }, { status: 400 }),
      };
    }

    return { data: result.data, error: null };
  } catch {
    return {
      data: null,
      error: json({ error: 'Invalid JSON in request body' }, { status: 400 }),
    };
  }
}
