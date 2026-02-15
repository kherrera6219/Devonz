import { isbot } from 'isbot';

/**
 * Runtime configuration and environment detection.
 * Central source of truth for "where are we running?".
 */

interface RuntimeConfig {
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
  isDesktop: boolean; // Running in Electron wrapper
  isWeb: boolean; // Running in standard browser
  isServer: boolean;
  isClient: boolean;
  platform: 'windows' | 'mac' | 'linux' | 'unknown';
}

const isServer = typeof window === 'undefined';
const isClient = !isServer;

/*
 * Simple detection for Electron renderer process
 * In a real Electron app, we'd check for window.process?.versions?.electron or user agent
 */
const isDesktop = isClient && (/Electron/.test(navigator.userAgent) || !!(window as any).electron);

const isWeb = !isDesktop;

const platform = ((): RuntimeConfig['platform'] => {
  if (isServer) {
    return 'unknown';
  } // Could detect via process.platform if needed

  const ua = navigator.userAgent;

  if (/Win/.test(ua)) {
    return 'windows';
  }

  if (/Mac/.test(ua)) {
    return 'mac';
  }

  if (/Linux/.test(ua)) {
    return 'linux';
  }

  return 'unknown';
})();

export const runtimeConfig: RuntimeConfig = {
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  isTest: import.meta.env.MODE === 'test',
  isDesktop,
  isWeb,
  isServer,
  isClient,
  platform,
};

export function isBot(request: Request): boolean {
  return isbot(request.headers.get('user-agent'));
}
