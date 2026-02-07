# Devonz

Devonz is an AI-powered development agent that helps you build full-stack applications through natural language conversation. Built upon [bolt.diy](https://github.com/stackblitz-labs/bolt.diy), Devonz has evolved into a robust, multi-agent coding platform focused on speed, efficiency, and architectural intelligence.

![Devonz Screenshot](https://github.com/user-attachments/assets/e4c3067d-2539-4b5e-abab-d129d90b51dc)

---

## Table of Contents

| Section                                 | Description                        |
| --------------------------------------- | ---------------------------------- |
| [Key Features](#key-features)           | Core capabilities and highlights   |
| [Tech Stack](#tech-stack)               | Technologies used in the project   |
| [Installation](#installation)           | Getting started guide              |
| [Configuration](#configuration)         | Environment variables and settings |
| [AI Providers](#supported-ai-providers) | Supported AI models and providers  |
| [Architecture](#architecture)           | Core services and multi-agent logic|
| [Project Structure](#project-structure) | Codebase organization              |
| [Available Scripts](#available-scripts) | Development and build commands     |
| [Settings](#settings--features)         | App settings and features          |
| [Contributing](#contributing)           | How to contribute                  |

---

## Key Features

### AI-Powered Development

| Feature                      | Description                                                                 |
| ---------------------------- | --------------------------------------------------------------------------- |
| Natural Language Building    | Describe what you want to build, and Devonz creates it                      |
| **Multi-Agent Orchestration** | **LangGraph-powered system featuring Coordinator, Researcher, and Architect** |
| **Advanced Event Streaming** | **Real-time transparency with granular event logs and progress tracking**   |
| **Expert Mode UI**           | **Deep technical insights via the Expert Drawer (Timeline, QC, Changes)**    |
| Model Context Protocol (MCP) | Extend Devonz capabilities with MCP tools                                   |
| Auto-Fix                     | Automatic error detection and fixing with terminal error detector           |
| **Multi-Language Expert**    | Support for 25+ programming languages (Python, Go, Rust, C++, Java, etc.)   |

### Specialized Agent Tools

| Tool                          | Description                                                              |
| ----------------------------- | ------------------------------------------------------------------------ |
| **Optimized Folder Import**   | Multi-stage import: MinIO backup → pgvector RAG indexing → Workspace sync |
| **AI Image Generation**       | Create assets, logos, and UI illustrations using DALL-E 3                 |
| **AI Audio Synthesis**        | Generate synthesized voiceovers and audio clips using OpenAI TTS         |
| **Professional PDF Creation** | Generate formatted reports and documentation directly in your project     |

### Development Environment

| Feature                 | Description                                           |
| ----------------------- | ----------------------------------------------------- |
| In-Browser Development  | Full development environment powered by WebContainers |
| Real-time Preview       | Instant preview of your applications                  |
| **RAG-Powered Memory**  | Long-term project memory using pgvector and LlamaIndex |
| **Knowledge Graph**     | Graph-based project understanding using Neo4j          |
| Integrated Code Editor  | CodeMirror editor with advanced syntax highlighting    |
| Terminal Access         | Full terminal access within the browser               |

---

## Tech Stack

| Category      | Technology                                                |
| ------------- | --------------------------------------------------------- |
| Framework     | [Remix](https://remix.run/) + [Vite](https://vitejs.dev/) |
| Language      | TypeScript                                                |
| Database      | PostgreSQL (pgvector), Neo4j, Redis, MinIO                |
| Orchestration | LangGraph, LangChain                                      |
| Styling       | UnoCSS + Tailwind CSS                                     |
| AI SDK        | Vercel AI SDK                                             |
| Editor        | CodeMirror                                                |
| Terminal      | xterm.js                                                  |
| WebContainers | StackBlitz WebContainer API                               |

---

## Installation

### Prerequisites

| Requirement | Version              |
| ----------- | -------------------- |
| Node.js     | 18.18.0 or higher    |
| pnpm        | Latest (recommended) |

### Quick Start

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/kherrera6219/Devonz.git
   cd Devonz
   ```

2. **Install Dependencies**:
   ```bash
   pnpm install
   ```

3. **Start Development Server**:
   ```bash
   pnpm run dev
   ```

4. **Open in Browser**: Navigate to `http://localhost:5173`

---

## Configuration

### Environment Variables

Create a `.env.local` file in the project root:

```bash
# Core AI Provider API Keys
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_GENERATIVE_AI_API_KEY=your_google_key

# Local Provider URLs (Optional)
OLLAMA_BASE_URL=http://127.0.0.1:11434
LMSTUDIO_BASE_URL=http://127.0.0.1:1234

# Deployment Integrations (Optional)
GITHUB_ACCESS_TOKEN=your_github_token
NETLIFY_AUTH_TOKEN=your_netlify_token
VERCEL_ACCESS_TOKEN=your_vercel_token
```

---

## Supported AI Providers

### Cloud Providers

| Provider       | Models                                         | Features              |
| -------------- | ---------------------------------------------- | --------------------- |
| OpenAI         | GPT-5.2, GPT-5                                 | Chat, Vision, Tools   |
| Anthropic      | Claude 4.5 Opus, 4.5 Sonnet                    | Chat, Vision, Tools   |
| Google         | Gemini 3.0 Pro, 3.0 Flash                      | Chat, Vision, Tools   |

> [!NOTE]
> Agent Orchestration defaults to **GPT-5.2** for Coordination, **Gemini 3.0 Flash** for Research, and **Claude 4.5 Opus** for Architectural tasks.

### Local Providers

| Provider    | Description                                          |
| ----------- | ---------------------------------------------------- |
| Ollama      | Run open-source models locally with model management |
| LM Studio   | Local model inference with GUI                       |
| OpenAI-like | Any OpenAI-compatible API endpoint                   |

---

## Architecture

Devonz uses a specialized multi-agent architecture powered by **LangGraph** to coordinate complex coding tasks:

### Agent Roles
- **Coordinator**: Orchestrates the overall workflow, manages state transitions, and creates high-level implementation plans.
- **Researcher**: Recursively analyzes the codebase using the Knowledge Graph and RAG to understand dependencies and patterns.
- **Architect/Executor**: Generates precise code changes, validates file impacts, and ensures implementation consistency.
- **QC Agent**: Reviews code changes for critical issues (security, types, logic) before they are finalized.

### Core Services
- **OrchestratorService**: Manages the LangGraph execution, utilizing a strict **v1 Event Bus** to stream detailed run lifecycle, stage transitions, and agent status events to the UI.
- **ContextService**: Optimizes the LLM context window by selecting relevant files and chat history.
- **GraphService**: Maintains a live Neo4j dependency graph for architectural analysis.
- **RAGService**: Provides semantic search capabilities over the project using LlamaIndex.
- **Standardized Shell**: Uses a centralized `root.tsx` document shell for consistent hydration and optimized SSR/client transitions.

---

## Project Structure

```tree
Devonz/
├── app/
│   ├── components/         # React components (Chat, Workspace, UI)
│   ├── lib/                # Core logic
│   │   ├── agent/          # Agent prompts & multi-language types
│   │   ├── agent-orchestrator/ # LangGraph multi-agent logic
│   │   ├── services/       # RAG, Storage, & Agent Tool services
│   │   ├── stores/         # Zustand state management
│   │   └── utils/          # File & Context utilities
│   ├── routes/             # Remix routes & API endpoints
│   ├── styles/             # Global CSS & UnoCSS tokens
│   └── types/              # Global TypeScript types
├── database/               # Infrastructure (PostgreSQL, MinIO, Redis, Neo4j)
├── public/                 # Static assets & Generated Media
├── scripts/                # Development & Maintenance scripts
└── supabase/               # Backend integrations
```

---

## Available Scripts

| Command              | Description              |
| -------------------- | ------------------------ |
| `pnpm run dev`       | Start development server  |
| `pnpm test`          | Run full unit test suite |
| `pnpm run typecheck` | TypeScript type checking |
| `pnpm run lint`      | ESLint check             |
| `pnpm run clean`     | Clean build artifacts    |

---

## Settings and Features

### Settings Tabs

| Tab            | Description                              |
| -------------- | ---------------------------------------- |
| Profile        | User profile management                  |
| Providers      | AI provider configuration (Core: OpenAI, Anthropic, Google) |
| Features       | Enable/disable advanced features         |
| Orchestrator   | LangGraph agent settings and model mapping|
| MCP            | Model Context Protocol tools             |
| GitHub         | GitHub integration settings              |
| Event Logs     | Application audit logs                   |
| Project Memory | RAG and Graph database status            |

---

## Contributing

We welcome contributions! Please fork the repository and open a Pull Request for any features or bug fixes.

---

## Acknowledgments

- **bolt.diy**: Original project foundation.
- **StackBlitz WebContainers**: Powering the in-browser development environment.
- **Vercel AI SDK**: Core AI integration.

---

<div align="center">
  <strong>Build anything with AI. Precision coding, orchestrated.</strong>
</div>
