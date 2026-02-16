# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-02-14

### Added
- **Stability**: Achieved **Zero-Error State** across the entire codebase (verified via `typecheck` and `lint`).
- **Storybook**: Standardized all `.stories.tsx` files to use `@storybook/react-vite`.
- **Infrastructure**: Automated cleanup of legacy build logs and temporary artifacts.

### Changed
- **Linter**: renomed Storybook decorator parameters to `storyComponent` for naming convention compliance.
- **Imports**: Converted all restricted relative imports to use the `~/` alias.
- **Refactor**: Surgically removed dozens of unused variables and parameters across the system.

### Fixed
- **Parsing**: Resolved syntax and parsing errors in `entry.server.tsx`.
- **Logic**: Fixed unhandled catch blocks and hidden characters in `metrics.server.ts`.
- **Dependencies**: Resolved missing `@remix-run/testing` and `jest-axe` in Storybook modules.

## [Unreleased]

### Added
-   **Security**: Microsoft Standard Headers (CSP, HSTS) in `entry.server.tsx`.
-   **Security**: Production error sanitization in `root.tsx`.
-   **Documentation**: Comprehensive docs (`ARCHITECTURE.md`, `DEPLOYMENT.md`, `CONTRIBUTING.md`).
-   **Feature**: Fluent Design UI overhaul (Mica, Acrylic, Semantic Buttons).
-   **Feature**: High-performance chat history (IndexedDB v3 + Pagination).
-   **Database**: `pgvector` schema migration for RAG.

### Changed
-   **Refactor**: Updated outdated `package.json` dependencies.
-   **UI**: Replaced Inter font with Segoe UI Variable stack.
-   **Optimization**: Limited initial chat load to improve TTI.

### Fixed
-   **Persistence**: Fixed import paths and restored logic in `BackupService` (`backup.ts`).
-   **Governance**: Resolved module resolution errors in `exporter.ts`, `migration.ts`, and `retention.ts`.
-   **Security**: Verified and fixed test imports in `security.test.ts`.
-   **Storybook**: Resolved `@remix-run/testing` dependency issues in `ChatBox.stories.tsx`.
