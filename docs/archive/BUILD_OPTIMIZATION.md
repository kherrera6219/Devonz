# Build & Bundle Optimization

Devonz is optimized for fast initial load times and efficient production builds.

## Strategy: Lazy Loading

Critical UI elements like the Header load immediately, while heavy functionality is deferred using `React.lazy` and `Suspense`.

### Instrumented Components
- **`DeployButton`**: Lazy-loaded to defer git and cloud provider logic.
- **`VercelDomainModal`**: Loaded only when interaction is required.
- **Deployment Dialogs**: GitHub and GitLab logic is separated into dynamic chunks.

## Vite Configuration

### Node Polyfills
The `vite-plugin-node-polyfills` is used to bridge Node.js dependencies for in-browser execution.
- **`path`**: Explicitly enabled to support `istextorbinary` and other file-system utilities.
- **Globals**: `Buffer` and `process` are polyfilled for compatibility with legacy AI SDKs and local tools.

### Production Build
Run `npm run build` to generate the optimized assets in the `/build` directory. The build process includes:
1. **Remix Vite Build**: Optimizes the client and server bundles.
2. **UnoCSS Processing**: Generates a minimal CSS file based on utility usage.
3. **Chunk Splitting**: Automatically separates vendors and lazy-loaded components.

## Monitoring
Use the `build_analysis_report.md` (generated in artifacts) during development to audit chunk sizes and identifies bloating dependencies.
