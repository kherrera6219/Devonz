# Project Structure Guide

> **Version**: 1.0.0
> **Last Updated**: Feb 16, 2026

This specific guide helps new developers understand "where things live" in Devonz.

## Directory Map

```tree
Devonz/
├── .github/                # GitHub Templates (Issues, PRs, Actions)
├── app/                    # Main Application Code (Remix)
│   ├── components/         # React Components
│   │   ├── @settings/      # Settings Tab Components
│   │   ├── chat/           # Chat Interface Components
│   │   ├── editor/         # Code Editor (CodeMirror)
│   │   ├── sidebar/        # Navigation & History
│   │   ├── ui/             # Reusable UI Kit (Buttons, Dialogs)
│   │   └── workbench/      # Terminal & Preview Panes
│   ├── lib/                # Core Business Logic
│   │   ├── .server/        # Server-Only Logic (LLM, Database)
│   │   ├── common/         # Shared Utilities (Prompts, Types)
│   │   ├── hooks/          # Custom React Hooks
│   │   ├── modules/        # Domain-Specific Subsystems
│   │   ├── persistence/    # Data Layer (Integrity, Encryption)
│   │   │   ├── governance/ # Backup, Retention, Migration, Export Logic
│   │   │   └── ...
│   │   ├── runtime/        # WebContainer Execution Logic
│   │   └── stores/         # Global State (Nanostores)
│   ├── routes/             # File-Based Routing (Pages & APIs)
│   │   ├── api.chat.ts     # Main Chat Endpoint
│   │   └── _index.tsx      # Home Page
│   ├── styles/             # Global CSS & UnoCSS
│   ├── types/              # TS Interfaces
│   └── utils/              # Helper Functions
├── database/               # Docker Compose for PG/MinIO/Neo4j
├── docs/                   # Documentation (Architecture, Guides)
├── migrations/             # SQL Migrations
├── public/                 # Static Assets (Fonts, Icons, Logos)
├── scripts/                # Build & Maintenance Scripts
└── vite.config.ts          # Build Configuration
```

## Key Conventions

### 1. Server vs. Client Code
-   Files named `*.server.ts` are **guaranteed** to be excluded from the client bundle. Use this for secrets, DB connections, and heavy AI libraries.
-   Files named `*.client.ts` run only in the browser.

### 2. State Management (Nanostores)
-   Global state lives in `app/lib/stores/`.
-   We use **Atoms** for simple values and **Maps** for objects.
-   Avoid React Context for rapidly changing data (like terminal output); use Nanostores to prevent re-renders.

### 3. API Routes
-   All backend logic lives in `app/routes/api.*.ts`.
-   These are Remix "Resource Routes" and return JSON.

## Where do I add...?

| I want to add... | Go to... |
| :--- | :--- |
| A new UI button | `app/components/ui/` |
| A database table | `migrations/` & `database/` |
| A global setting | `app/lib/stores/settings.ts` |
| A new AI provider | `app/lib/.server/llm/` |
| An external API client | `app/lib/modules/connectors/` |
| A security guard/check | `app/lib/modules/security/` |
| A custom metric | `app/lib/modules/observability/` |
