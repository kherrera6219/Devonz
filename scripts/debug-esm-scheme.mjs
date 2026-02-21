// debug-esm-scheme.mjs
// A Node.js --import hook to intercept ERR_UNSUPPORTED_ESM_URL_SCHEME errors
// and print the stack trace showing exactly which file calls import() with a bad URL.
// Usage: node --import=./scripts/debug-esm-scheme.mjs ...

// Override Error to detect it
const originalPrepareStackTrace = Error.prepareStackTrace;

// We monkey-patch the load function in the module internals
// by intercepting the 'beforeExit' or using AsyncLocalStorage.
// Actually, the cleanest way is to add an unhandledRejection/uncaughtException handler
// that re-throws only AFTER printing better info.

process.on('uncaughtExceptionMonitor', (err, origin) => {
  if (err && err.code === 'ERR_UNSUPPORTED_ESM_URL_SCHEME') {
    console.error('\n=== DEBUG: ERR_UNSUPPORTED_ESM_URL_SCHEME intercepted ===');
    console.error('Error message:', err.message);
    console.error('Error input URL:', err.input);
    console.error('\nFull stack:');
    console.error(err.stack);

    // Try to find the import() call chain more precisely
    if (Error.captureStackTrace) {
      const captureErr = {};
      Error.captureStackTrace(captureErr);
      console.error('\nCapture stack at monitor point:');
      console.error(captureErr.stack);
    }
    console.error('=== END DEBUG ===\n');
  }
});
