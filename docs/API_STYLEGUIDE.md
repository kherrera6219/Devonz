# API Style Guide

> **Version**: 1.0.0
> **Last Updated**: Feb 2026

## Principles
1.  **Predictability**: URLs and payloads should follow standard patterns.
2.  **Type Safety**: All inputs/outputs must be typed via Zod schemas.
3.  **Security**: Authentication and Validation are mandatory.

## URL Structure
-   **Resource-Oriented**: `/api/v1/<resource>`
-   **Examples**:
    -   `GET /api/projects` (List)
    -   `POST /api/projects` (Create)
    -   `GET /api/projects/:id` (Retrieve)
    -   `PATCH /api/projects/:id` (Update)

## Request/Response Format
Use JSON for all interactions.

### Standard Response Envelope
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any; // Validation errors
  };
}
```

## Error Handling
-   Use standard HTTP Status Codes (200, 400, 401, 403, 404, 500).
-   Never return stack traces in `error.message`.

## External Service Connectors

All requests to external APIs **must** use the `BaseConnector` or `OAuthConnector` abstractions located in `app/lib/modules/connectors/`.

### Mandatory Patterns
1.  **SSRF Protection**: All outgoing URLs are validated by `SSRFGuard` before execution.
2.  **Contract Validation**: Responses must be validated against a Zod schema using `connector.request(url, schema)`.
3.  **Observability**: Connectors automatically track latency and increment metrics.

```typescript
// Example Implementation
class GitHubConnector extends BaseConnector {
  async getRepo(repo: string) {
    return this.request(`${API_URL}/${repo}`, repoSchema);
  }
}
```

## Validation (Zod)
Every API route **must** export its Zod schema for client-side type inference.
```typescript
export const createProjectSchema = z.object({
  name: z.string().min(3),
  private: z.boolean().default(true),
});
```
