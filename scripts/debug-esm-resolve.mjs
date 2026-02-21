// debug-esm-resolve.mjs - ESM resolve hook to catch bad Windows paths before they throw
// Usage: NODE_OPTIONS="--import=file:///path/to/debug-esm-resolve.mjs" node ...

export async function resolve(specifier, context, nextResolve) {
  if (/^[a-zA-Z]:/.test(specifier)) {
    console.error(`\n[ESM-HOOK] Caught bare Windows path in resolve hook!`);
    console.error(`  Specifier: ${specifier}`);
    console.error(`  Parent URL: ${context.parentURL}`);
    // Print a JS stack to show who called import()
    const err = new Error('trace');
    console.error(`  JS Stack:\n${err.stack}`);
  }
  return nextResolve(specifier, context);
}
