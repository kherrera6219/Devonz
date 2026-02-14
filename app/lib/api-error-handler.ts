import { json } from '@remix-run/node';
import { createScopedLogger } from '~/utils/logger';
import { sanitizeErrorMessage } from './security';

const logger = createScopedLogger('api-error');

/**
 * Standardized API error response format.
 */
interface ApiErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}

/**
 * Maps common error patterns to appropriate HTTP status codes and messages.
 */
function classifyError(error: unknown): { status: number; message: string } {
  if (!(error instanceof Error)) {
    return { status: 500, message: 'An unexpected error occurred' };
  }

  const msg = error.message.toLowerCase();

  // Authentication errors
  if (
    msg.includes('api key') ||
    msg.includes('unauthorized') ||
    msg.includes('authentication') ||
    msg.includes('token')
  ) {
    return { status: 401, message: 'Authentication failed' };
  }

  // Rate limiting
  if (msg.includes('rate limit') || msg.includes('429') || msg.includes('too many requests')) {
    return { status: 429, message: 'Rate limit exceeded. Please try again later.' };
  }

  // Not found
  if (msg.includes('not found') || msg.includes('404')) {
    return { status: 404, message: 'Resource not found' };
  }

  // Validation errors
  if (msg.includes('invalid') || msg.includes('validation') || msg.includes('missing')) {
    return { status: 400, message: 'Invalid request' };
  }

  // Timeout
  if (msg.includes('timeout') || msg.includes('timed out')) {
    return { status: 504, message: 'Request timed out' };
  }

  // Default
  return { status: 500, message: 'An unexpected error occurred' };
}

/**
 * Standardized error handler for API routes.
 * Logs the full error server-side and returns a safe response to the client.
 */
export function handleApiError(error: unknown, routeName: string): Response {
  const { status, message } = classifyError(error);
  const isDev = process.env.NODE_ENV === 'development';

  logger.error(`[${routeName}]`, error);

  const response: ApiErrorResponse = {
    error: 'true',
    message: isDev ? sanitizeErrorMessage(error, true) : message,
    statusCode: status,
  };

  return json(response, { status }) as unknown as Response;
}
