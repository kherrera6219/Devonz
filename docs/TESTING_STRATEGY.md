# Testing Strategy

> **Version**: 1.0.0
> **Last Updated**: Feb 2026

## Philosophy
We follow the **Testing Pyramid**: lots of unit tests, some integration tests, and few critical E2E tests.

## 1. Unit Testing (Vitest)
**Scope**: Individual functions, utilities, and isolated components.
-   **Tools**: `vitest`, `react-testing-library`.
-   **Coverage Goal**: >80% for `lib/`, `utils/`.
-   **Naming**: `*.test.ts`, `*.spec.tsx`.

## 2. Integration Testing
**Scope**: Agent workflows, Database interactions, API endpoints.
-   **Tools**: `vitest` with test database container.
-   **Focus**: Ensure `OrchestratorService` correctly handles state transitions in LangGraph.

## 3. End-to-End (E2E) Testing (Playwright)
**Scope**: Critical User Journeys (CUJs).
-   **Tools**: Playwright.
-   **Scenarios**:
    1.  User Sign Up/Login.
    2.  Create New Project.
    3.  Chat with Agent -> Code Generation -> Preview.
    4.  Save & Load History.

## 4. Visual Regression Testing
-   **Tools**: Storybook (`@storybook/react-vite`) + Chromatic (Future).
-   **Goal**: Prevent UI regressions in the Fluent Design system and verify component variants in isolation.

## CI/CD Pipeline
Every PR must pass:
1.  `pnpm lint` (Static Analysis)
2.  `pnpm typecheck` (Type Safety)
3.  `pnpm test` (Unit/Integration)
