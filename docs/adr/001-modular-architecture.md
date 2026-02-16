# ADR 001: Modular Architecture for Enterprise Subsystems

*   **Status**: Accepted
*   **Deciders**: Devonz Arch Team
*   **Date**: 2026-02-14

## Context and Problem Statement
As Devonz scales to support 2026 enterprise standards, the business logic has become fragmented. We need a consistent way to organize "singleton-like" services (Security, Governance, Observability) that is distinct from generic utilities or persistence layers.

## Decision Outcome
We will adopt a **Modular Domain Pattern** in `app/lib/modules/`.

### Structure
- `modules/security/`: RBAC, Secrets, Tenant Isolation.
- `modules/governance/`: AI Guardrails, Prompt Registry, Cost Monitoring.
- `modules/observability/`: Metrics, Logs, Diagnostics.
- `modules/connectors/`: External API integrations with SSRF protection.

### Principles
1.  **Strict Isolation**: Modules should communicate via well-defined class methods, not direct internal state access.
2.  **Singleton Purity**: Each module should export a single, stable instance via `getInstance()`.
3.  **Security First**: Privacy and security logic (e.g., Redaction) must be centralized in the `security` module.

## Consequences
- **Positive**: Clearer project structure, easier auditing, and standard patterns for new integrations.
- **Negative**: Slight boilerplate increase for new services.
