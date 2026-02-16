# Remix Architecture & Hydration Strategy

Following a series of hydration and black-screen issues, the Devonz architecture was standardized to follow strict Remix best practices.

## Document Shell Centralization

Previously, the HTML document shell was fragmented between `root.tsx` and various route files (like `_index.tsx`). This caused mismatches during hydration.

### Key Changes
- **`root.tsx`**: Now serves as the single source of truth for the `<html>`, `<head>`, and `<body>` tags.
- **Layout Component**: The `Layout` function in `root.tsx` manages the global structure, including `<Meta />`, `<Links />`, and `<Scripts />`.
- **Hydration Logging**: `entry.client.tsx` includes instrumentation to detect and log hydration mismatches in development mode.

## Client-Only Components

To prevent SSR (Server-Side Rendering) mismatches for browser-specific APIs (like `localStorage` or `WebContainer`), use the standardized `ClientOnly` wrapper.

```tsx
<ClientOnly fallback={<Skeleton />}>
  {() => <BrowserSpecificComponent />}
</ClientOnly>
```

## Best Practices for Developers
1. **Avoid `window` in global scope**: Always check for `typeof window !== 'undefined'` or use `useEffect`.
2. **Centralized Styles**: Add global styles to the `links` export in `root.tsx` instead of importing CSS directly in components where possible.
3. **Skeleton Fallbacks**: Always provide a visual fallback for `ClientOnly` components to prevent layout shift.
