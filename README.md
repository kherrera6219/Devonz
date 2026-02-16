# Devonz

![Devonz](https://github.com/user-attachments/assets/e4c3067d-2539-4b5e-abab-d129d90b51dc)

**Build anything with AI. Precision coding, orchestrated.**

> **Version**: 1.0.0
> **Status**: Production Ready
> **Last Updated**: Feb 16, 2026

Devonz is a sophisticated **multi-agent AI development environment** designed to accelerate full-stack application building. By orchestrating specialized agents (Coordinator, Researcher, Architect) via **LangGraph**, it transforms natural language requests into production-grade code with precision and context-awareness.

Built on the latest **Remix** and **Vite 7** stack, it offers a blazing fast, secure, and enterprise-ready foundation for AI-assisted engineering.

---

## 📚 Documentation

| Guide | Description |
| :--- | :--- |
| [**Architecture**](./ARCHITECTURE.md) | System design, agent orchestration, and data flow diagrams. |
| [**Deployment**](./DEPLOYMENT.md) | Production setup, environment variables, and build requirements. |
| [**Security**](./SECURITY.md) | Vulnerability reporting, policies, and security subsystems. |
| [**Desktop Governance**](./docs/DESKTOP_GOVERNANCE.md) | Windows installer (`.msix`), updates, and port management. |
| [**Release Checklist**](./docs/RELEASE_CHECKLIST.md) | Standardized workflow for reliable production deployments. |
| [**Project Structure**](./docs/PROJECT_STRUCTURE.md) | Annotated map of the file system and key directories. |

---

## ✨ Key Features (2026 Edition)

Devonz has been re-architected for performance, security, and scalability.

### 🧠 Intelligent Orchestration
*   **Multi-Agent System**: Specialized agents (Coordinator, Researcher, Architect) work in concert via **LangGraph** to solve complex tasks.
*   **Contextual Memory**: Hybrid persistence using **PostgreSQL** (Relational), **pgvector** (Semantic), and **Neo4j** (Graph) for deep context retention.
*   **WebContainer Runtime**: Executes code safely in a browser-based Node.js sandbox, ensuring secure & isolated environments.

### 🛡️ Enterprise-Grade Security
*   **AI Governance**: Real-time prompt injection detection, guardrails, and usage monitoring (Token/Cost tracking).
*   **Data Protection**: **AES-256** encryption-at-rest for sensitive data and **HMAC-SHA256** integrity verification for chat snapshots.
*   **Zero-Trust**: Comprehensive **RBAC** enforcement, **SSRFGuard** for external requests, and automated **Log Redaction** for secrets.

### ⚡ Modern Infrastructure
*   **Vite 7 Powered**: Upgraded to the latest Vite ecosystem for instant HMR and optimized builds (requires Node.js v20+).
*   **Fluent Design**: Stunning, native-class Windows 11 aesthetics (Mica, Acrylic) powered by **UnoCSS** and **Tailwind**.
*   **Resilient Persistence**: Local-first architecture using **IndexedDB** with robust cloud synchronization.

### ✅ Strict Quality Assurance
*   **Zero-Error Policy**: Global CI/CD pipeline enforces 100% test passing, linting compliance, and type safety.
*   **Current Status**: **333/333 Tests Passing** (Unit, Integration, E2E).
*   **Security Audited**: Proactive dependency management and regular vulnerability scans.

---

## 🚀 Quick Start

### Prerequisites
* **Node.js**: v20.19.0+ or v22.12.0+ (Strict requirement for Vite 7)
* **pnpm**: v9+ (Recommended)

### Installation

1. **Clone & Install**

    ```bash
    git clone https://github.com/kherrera6219/Devonz.git
    cd Devonz
    pnpm install
    ```

2. **Configure Environment**

    ```bash
    cp .env.example .env.local
    # Edit .env.local with your API keys (OpenAI, Anthropic, etc.)
    ```

3. **Start Development Server**

    ```bash
    pnpm run dev
    ```

    Visit `http://localhost:5173` to start building.

---

## 🛠️ Tech Stack

* **Frontend**: Remix, React 18, Vite 7, UnoCSS, Tailwind CSS
* **AI/LLM**: Vercel AI SDK, LangGraph, LangChain
* **Database**: PostgreSQL, pgvector, Neo4j, Redis, MinIO
* **Local Persistence**: IndexedDB, Nanostores
* **Testing**: Vitest, Playwright, Testing Library

---

> [!NOTE]
> This project follows [Microsoft Open Source](https://opensource.microsoft.com/codeofconduct/) standards. For contribution guidelines, please see [CONTRIBUTING.md](./CONTRIBUTING.md).
