// import { Chalk } from 'chalk';

let chalk: unknown;

if (typeof process !== 'undefined' && process.release?.name === 'node' && process.env.NODE_ENV !== 'production') {
  import('chalk')
    .then((m) => {
      chalk = new m.Chalk({ level: 3 });
    })
    .catch(() => {
      /* ignore */
    });
}

export type DebugLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'none';

type LoggerFunction = (...messages: unknown[]) => void;

interface Logger {
  trace: LoggerFunction;
  debug: LoggerFunction;
  info: LoggerFunction;
  warn: LoggerFunction;
  error: LoggerFunction;
  setLevel: (level: DebugLevel) => void;
}

// Server-side Request ID retrieval (safe for isomorphic usage)
const getRequestId: () => string | undefined = () => undefined;

/*
 * // Disabled for build stability - dynamic import of server module breaks client bundle
 *if (typeof process !== 'undefined' && process.release?.name === 'node' && typeof window === 'undefined') {
 *  import('~/lib/context.server').then((m) => {
 *    getRequestId = m.getRequestId;
 *  }).catch(() => {
 *    // Ignore errors
 *  });
 *}
 */

const getLogLevel = (): DebugLevel => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env.VITE_LOG_LEVEL || (import.meta.env.DEV ? 'debug' : 'info');
    }
  } catch {
    // Fallback if import.meta is not available
  }

  return 'info';
};

let currentLevel: DebugLevel = getLogLevel();

export const logger: Logger = {
  trace: (...messages: unknown[]) => logWithDebugCapture('trace', undefined, messages),
  debug: (...messages: unknown[]) => logWithDebugCapture('debug', undefined, messages),
  info: (...messages: unknown[]) => logWithDebugCapture('info', undefined, messages),
  warn: (...messages: unknown[]) => logWithDebugCapture('warn', undefined, messages),
  error: (...messages: unknown[]) => logWithDebugCapture('error', undefined, messages),
  setLevel,
};

export function createScopedLogger(scope: string): Logger {
  return {
    trace: (...messages: unknown[]) => logWithDebugCapture('trace', scope, messages),
    debug: (...messages: unknown[]) => logWithDebugCapture('debug', scope, messages),
    info: (...messages: unknown[]) => logWithDebugCapture('info', scope, messages),
    warn: (...messages: unknown[]) => logWithDebugCapture('warn', scope, messages),
    error: (...messages: unknown[]) => logWithDebugCapture('error', scope, messages),
    setLevel,
  };
}

function setLevel(level: DebugLevel) {
  try {
    if ((level === 'trace' || level === 'debug') && import.meta.env && import.meta.env.PROD) {
      return;
    }
  } catch {
    // Fallback
  }

  currentLevel = level;
}

function log(level: DebugLevel, scope: string | undefined, messages: unknown[]) {
  const levelOrder: DebugLevel[] = ['trace', 'debug', 'info', 'warn', 'error', 'none'];

  if (levelOrder.indexOf(level) < levelOrder.indexOf(currentLevel)) {
    return;
  }

  // If current level is 'none', don't log anything
  if (currentLevel === 'none') {
    return;
  }

  // Production JSON Logging
  if (process.env.NODE_ENV === 'production') {
    const timestamp = new Date().toISOString();
    const requestId = getRequestId();

    const logObject = {
      timestamp,
      level,
      requestId,
      scope,
      message: messages.map((m) => (typeof m === 'object' ? JSON.stringify(m) : String(m))).join(' '),
      data: messages.length > 1 ? messages.slice(1) : undefined,
    };

    // Use console.log/error directly for JSON output without chalk formatting
    if (level === 'error') {
      console.error(JSON.stringify(logObject));
    } else {
      console.log(JSON.stringify(logObject));
    }

    return;
  }

  // Development Pretty Logging (Chalk)
  const allMessages = messages.reduce((acc: string, current: unknown) => {
    const currentStr = typeof current === 'object' ? JSON.stringify(current) : String(current);

    if (acc.endsWith('\n')) {
      return acc + currentStr;
    }

    if (!acc) {
      return currentStr;
    }

    return `${acc} ${currentStr}`;
  }, '');

  const labelBackgroundColor = getColorForLevel(level);
  const labelTextColor = level === 'warn' ? '#000000' : '#FFFFFF';

  const labelStyles = getLabelStyles(labelBackgroundColor, labelTextColor);
  const scopeStyles = getLabelStyles('#77828D', 'white');

  const styles = [labelStyles];

  if (typeof scope === 'string') {
    styles.push('', scopeStyles);
  }

  let labelText = formatText(` ${level.toUpperCase()} `, labelTextColor, labelBackgroundColor);
  const requestId = getRequestId();

  if (scope) {
    labelText = `${labelText} ${formatText(` ${scope} `, '#FFFFFF', '77828D')}`;
  }

  if (requestId) {
    labelText = `${formatText(` ${requestId.slice(0, 8)} `, '#000000', '#D3D3D3')} ${labelText}`;
  }

  if (typeof window !== 'undefined') {
    console.log(`%c${level.toUpperCase()}${scope ? `%c %c${scope}` : ''}`, ...styles, allMessages);
  } else {
    console.log(`${labelText}`, allMessages);
  }
}

function formatText(text: string, color: string, bg: string) {
  if (chalk) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (chalk as any).bgHex(bg)((chalk as any).hex(color)(text));
  }

  return text;
}

function getLabelStyles(color: string, textColor: string) {
  return `background-color: ${color}; color: white; border: 4px solid ${color}; color: ${textColor};`;
}

function getColorForLevel(level: DebugLevel): string {
  switch (level) {
    case 'trace':
    case 'debug': {
      return '#77828D';
    }
    case 'info': {
      return '#1389FD';
    }
    case 'warn': {
      return '#FFDB6C';
    }
    case 'error': {
      return '#EE4744';
    }
    default: {
      return '#000000';
    }
  }
}

export const renderLogger = createScopedLogger('Render');

// Debug logging integration
let debugLogger: {
  captureLog: (
    level: 'trace' | 'debug' | 'info' | 'warn' | 'error',
    scope: string | undefined,
    messages: unknown[],
  ) => void;
} | null = null;

// Lazy load debug logger to avoid circular dependencies
const getDebugLogger = () => {
  if (!debugLogger && typeof window !== 'undefined') {
    try {
      // Use dynamic import asynchronously but don't block the function
      import('./debugLogger')
        .then(({ debugLogger: loggerInstance }) => {
          debugLogger = loggerInstance;
        })
        .catch(() => {
          // Debug logger not available, skip integration
        });
    } catch {
      // Debug logger not available, skip integration
    }
  }

  return debugLogger;
};

// Override the log function to also capture to debug logger

function logWithDebugCapture(level: DebugLevel, scope: string | undefined, messages: unknown[]) {
  // Call original log function (the one that does the actual console logging)
  log(level, scope, messages);

  // Capture log to debug logger if it exists and level is not 'none'
  if (level !== 'none' && typeof window !== 'undefined') {
    const loggerInstance = getDebugLogger();

    if (loggerInstance) {
      loggerInstance.captureLog(level as 'trace' | 'debug' | 'info' | 'warn' | 'error', scope, messages);
    }
  }
}
