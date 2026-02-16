# Security Policy

> **Version**: 1.0.0
> **Last Updated**: Feb 16, 2026

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |
| < 1.0   | :x:                |

## Security Subsystems (2026 Edition)

Devonz implements multiple layers of defense-in-depth to protect users and agentic workloads.

### 1. AI Governance & Safety
-   **Guardrail Service**: Integrated layer that detects prompt injection attempts and moderates LLM outputs for safety compliance.
-   **Audit Trail**: Comprehensive, immutable logging of all AI interactions, including system prompts and model transitions.
-   **Prompt Registry**: Versioned management of system prompts to ensure consistent and safe agent behavior.

### 2. Data Protection & Privacy
-   **Encryption-at-Rest**: All sensitive project data and API keys are protected using AES-256-GCM authenticated encryption.
-   **Snapshot Integrity**: HMAC-SHA256 signatures verify the integrity of chat snapshots and persistence states.
-   **Log Redactor**: Automated framework that scrubs secrets (API keys, tokens, PII) from logs and diagnostic exports.
-   **Data Retention**: Automated engine enforces data lifecycle policies and secure deletion.

### 3. Identity & Access Control
-   **RBAC Engine**: Role-Based Access Control (Admin, Developer, Viewer) enforces least-privileged access to project resources.
-   **Secrets Manager**: Integrated abstraction with OS-level vault hooks (Keychain, Credential Manager) for secure token storage.
-   **Tenant Isolation**: Cryptographic guards prevent cross-tenant data leakage in multi-user environments.

### 4. Network & Infrastructure
-   **SSRF Protection**: Outgoing request gating blocks SSRF attempts by preventing connectors from accessing internal IP ranges.
-   **CI Enforcement Pipeline**: Automated GitHub Actions pipeline validates every PR for linting, typechecking, and security regressions.
-   **Pre-commit Validation**: Local git hooks enforce code quality and security checks before any code is committed.
-   **Strict Headers**: Production environments strictly enforce HSTS, CSP, and X-Content-Type-Options.
-   **WebContainer Isolation**: User code execution is sandboxed within a browser-side virtual machine (WebContainer).

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please do NOT open an issue.

Instead, please report it via email to **security@devonz.com** or use GitHub Security Advisories.

### Response Timeline
-   **Acknowledgement**: Within 24 hours.
-   **Fix Timeline**: Within 5 business days for critical issues.
