// intercept-loader.mjs - Node.js ESM loader hook to debug ERR_UNSUPPORTED_ESM_URL_SCHEME
// Usage: node --import ./scripts/intercept-loader.mjs ...

import { pathToFileURL } from 'node:url';

const originalLoad = globalThis.__originalLoad;

export async function resolve(specifier, context, nextResolve) {
  // Check for bare Windows paths before they hit the loader
  if (/^[a-zA-Z]:/.test(specifier)) {
    console.log(`[INTERCEPT] Bare Windows path intercepted: ${specifier}`);
    console.trace('Stack trace:');
    const converted = pathToFileURL(specifier).href;
    console.log(`[INTERCEPT] Converting to: ${converted}`);
    specifier = converted;
  }
  return nextResolve(specifier, context);
}
