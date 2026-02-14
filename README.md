# Devonz

![Devonz](https://github.com/user-attachments/assets/e4c3067d-2539-4b5e-abab-d129d90b51dc)

**Build anything with AI. Precision coding, orchestrated.**

> **Version**: 1.0.0
> **Last Updated**: Feb 2026

Devonz is a multi-agent AI development environment that helps you build full-stack applications through natural language. Built on Remix, Vite, and LangGraph, it orchestrates specialized agents to plan, architect, and execute complex software tasks with precision.

---

## 📚 Documentation

| Guide | Description |
| :--- | :--- |
| [**Architecture**](./ARCHITECTURE.md) | System design, data flow, and agent orchestration logic. |
| [**Deployment**](./DEPLOYMENT.md) | Production setup, environment variables, and build guides. |
| [**Security**](./SECURITY.md) | Vulnerability reporting and security policies. |
| [**Project Structure**](./docs/PROJECT_STRUCTURE.md) | Annotated file system map for new developers. |

---

## ✨ Key Features (2026 Edition)

-   **Fluent Design UI**: Native Windows 11 aesthetics (Mica, Acrylic) with a polished UX.
-   **Multi-Agent Orchestration**: Specialized Coordinator, Researcher, and Architect agents working in tandem.
-   **Enterprise Security**: Microsoft Standard compliance (HSTS, CSP, Strict Error Handling).
-   **RAG-Powered Memory**: Long-term project context via `pgvector` and Neo4j.
-   **WebContainer Environment**: Full Node.js runtime directly in the browser.

## 🚀 Quick Start

1.  **Clone & Install**
    ```bash
    git clone https://github.com/kherrera6219/Devonz.git
    cd Devonz
    pnpm install
    ```

2.  **Configure**
    ```bash
    cp .env.example .env.local
    # Add your OpenAI/Anthropic keys to .env.local
    ```

3.  **Run**
    ```bash
    pnpm run dev
    ```
    Visit `http://localhost:5173` to start building.

---

## Tech Stack

-   **Framework**: Remix + Vite
-   **Language**: TypeScript (Strict)
-   **AI**: Vercel AI SDK + LangGraph
-   **Database**: PostgreSQL (pgvector), Neo4j, IndexedDB, MinIO
-   **Styling**: UnoCSS + Tailwind CSS + Fluent Design

---

> [!NOTE]
> This project follows [Microsoft Open Source](https://opensource.microsoft.com/codeofconduct/) standards. for more details, please see [CONTRIBUTING.md](./CONTRIBUTING.md).
