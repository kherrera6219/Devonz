# System Architecture

> **Version**: 1.0.0
> **Last Updated**: Feb 16, 2026 (Dependency Migration)
> **ADR Registry**: [docs/adr](./docs/adr)

## Overview
Devonz is a multi-agent AI coding environment built on a modern web stack. It orchestrates specialized AI agents (Coordinator, Researcher, Architect) to plan, execute, and verify complex software tasks.

## High-Level Design

```mermaid
graph TD
    User[User Interaction] --> Client[Remix Client (React)]
    Client --> Server[Remix Server (Node/Edge)]
    Server --> Agents[Agent Orchestrator (LangGraph)]
    
    subgraph "Governance & Security"
        Agents --> Guardrails[Guardrail Service]
        Agents --> Audit[Audit Trail]
        Agents --> RBAC[RBAC Engine]
    end
    
    subgraph "Agent Layer"
        Agents --> Coordinator[Coordinator Agent]
        Agents --> Researcher[Researcher Agent]
        Agents --> Architect[Architect Agent]
    end
    
    subgraph "Data Layer"
        Agents --> PGVector[(PostgreSQL + pgvector)]
        Agents --> Neo4j[(Neo4j Graph DB)]
        Agents --> Redis[(Redis Cache/Metrics)]
        Agents --> Encryption[Encryption Service]
    end
```

## Key Components

### 1. AI Governance Subsystem
-   **Guardrail Layer**: Real-time prompt injection detection and output moderation.
-   **Prompt Registry**: Versioned, centralized management of system prompts for MAS agents.
-   **Usage Monitor**: Redis-backed token tracking, cost estimation, and budget enforcement.
-   **Routing Engine**: Policy-based LLM selection (Cost, Latency, Precision).

### 2. Enhanced Data Layer
-   **Snapshot Integrity**: HMAC-SHA256 verification to prevent tampering of chat states.
-   **Encryption-at-Rest**: AES-256-GCM authenticated encryption for sensitive project data.
-   **Retention Engine**: Automated lifecycle management and data purging policies.
-   **Schema Parity**: Automated validation between Local (IndexedDB) and Cloud (Postgres) schemas.

### 3. Agent Orchestration
-   **Framework**: LangGraph.
-   **Pattern**: State Machine with cyclical graph nodes.
-   **Memory**: Short-term (Conversation) + Long-term (RAG/Embeddings) + Managed Persistence.

### 4. Persistence
-   **Relational**: PostgreSQL (User data, Projects).
-   **Vector**: pgvector (Code embeddings, Semantic search).
-   **Local**: IndexedDB (Chat history, offline capability) with integrity verification.
-   **Cache**: Redis (Rate limiting, Session state, Usage metrics).

## Data Flow

1.  **User Request**: User sends a prompt via Chat UI.
2.  **Security Gating**: `SSRFGuard` validates outgoing requests; `GuardrailService` inspects the prompt.
3.  **Startup Validation**: `StartupValidator` ensures environment health; `PortResolution` handles local port availability.
4.  **Orchestration**: `api.chat.ts` receives request, `OrchestratorService` spins up the LangGraph graph.
4.  **Agent Logic**: 
    -   `ModelRoutingEngine` selects the optimal LLM based on policy.
    -   Agents (Coordinator -> Researcher -> Architect) interact to solve the task.
5.  **Tool Execution**: Agents call tools which execute inside the **WebContainer** (browser-side) or Server (file system).
6.  **Persistence**: Every interaction is logged to `AuditTrail`; Project state is encrypted via `EncryptionService`.
7.  **Streaming Response**: Results are moderated by Guardrails and streamed back to the UI.

## Security Architecture
-   **Network**: SSRF protection for all external API connectors.
-   **Identity**: RBAC enforcement engine and secure session management.
-   **Secrets**: OS-level vault integration (Keychain/Credential Manager) for API keys.
-   **Privacy**: Automated log redaction for sensitive entities (Keys, IPs, PII).
-   **Sandboxing**: isolated WebContainers for code execution.
