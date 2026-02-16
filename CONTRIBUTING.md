# Contributing to Devonz

> **Version**: 1.0.0
> **Last Updated**: Feb 2026

Thank you for your interest in contributing to **Devonz**! We welcome contributions from the community to help make this the best AI-powered development agent.

## Code of Conduct
This project adopts the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Getting Started

### Prerequisites
-   **Node.js**: v20.19.0+ or v22.12.0+ (Strict Requirement for Vite 7)
-   **pnpm**: v9+ (Recommended package manager)
-   **Git**: Latest version

### Development Setup
1.  **Fork and Clone** the repository:
    ```bash
    git clone https://github.com/YOUR_USERNAME/Devonz.git
    cd Devonz
    ```

2.  **Install Dependencies**:
    ```bash
    pnpm install
    ```

3.  **Configure Environment**:
    Copy `.env.example` to `.env.local` and add your API keys:
    ```bash
    cp .env.example .env.local
    ```

4.  **Start Development Server**:
    ```bash
    pnpm run dev
    ```
    Open [http://localhost:5173](http://localhost:5173) in your browser.

5.  **View UI Component Gallery**:
    ```bash
    pnpm run storybook
    ```
    Open [http://localhost:6006](http://localhost:6006) to view and test UI components in isolation.

## Workflow
1.  **Branching**: Create a feature branch (`git checkout -b feature/my-cool-feature`).
2.  **Commits**: Use conventional commits (e.g., `feat: add new sidebar`, `fix: resolve auth bug`).
3.  **Testing**: Ensure all tests pass (`pnpm test` runs the full suite: Unit, Integration, and A11y).
4.  **UI Verification**: Check components in Storybook (`pnpm run storybook`).
5.  **Linting & Typechecking**: Ensure compliance (`pnpm run lint` and `pnpm run typecheck`).
5.  **Pre-commit Hooks**: The project uses **Husky** to enforce linting and type safety locally. If a hook fails, resolve the issues before committing.

## Pull Request Process
1.  Update the `README.md` with details of changes to the interface, if applicable.
2.  Update `docs/` if you change architecture or verified deployment processes.
3.  The PR must pass all CI checks (Lint, Build, Test).
4.  A maintainer will review your PR. Once approved, it will be merged.

## Style Guide
-   **TypeScript**: Strict mode is enabled. No `any` types unless absolutely necessary.
-   **Styling**: Use Tailwind CSS utility classes and `UnoCSS` tokens. Avoid inline styles.
-   **Components**: Use functional components and hooks.

We look forward to your contributions!
