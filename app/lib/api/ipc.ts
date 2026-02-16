import { runtimeConfig } from '~/lib/runtime/config';

/**
 * Secure IPC Abstraction Layer.
 * Provides a type-safe bridge to the Main process (Electron) if available.
 * Fails gracefully or provides mock implementations in Web mode.
 */

// Define the interface for the 'window.electron' object embedded by preload scripts
interface IElectronAPI {
  send: (channel: string, data: any) => void;
  receive: (channel: string, func: (...args: any[]) => void) => void;
  invoke: (channel: string, data?: any) => Promise<any>;
}

declare global {
  interface Window {
    electron?: IElectronAPI;
  }
}

class IPCService {
  private static _instance: IPCService;

  private constructor() {
    // Singleton
  }

  static getInstance(): IPCService {
    if (!IPCService._instance) {
      IPCService._instance = new IPCService();
    }

    return IPCService._instance;
  }

  /**
   * Invoke a remote method on the Main process.
   * Returns a Promise.
   */
  async invoke<T = any>(channel: string, data?: any): Promise<T> {
    if (!runtimeConfig.isDesktop || !window.electron) {
      console.warn(`[IPC] 'invoke' called on '${channel}' but not in Desktop mode.`);
      throw new Error('IPC not available in Web mode');
    }

    try {
      return await window.electron.invoke(channel, data);
    } catch (error) {
      console.error(`[IPC] Invoke failed on '${channel}':`, error);
      throw error;
    }
  }

  /**
   * Send a one-way message to the Main process.
   */
  send(channel: string, data?: any): void {
    if (!runtimeConfig.isDesktop || !window.electron) {
      console.warn(`[IPC] 'send' called on '${channel}' but not in Desktop mode.`);
      return;
    }

    window.electron.send(channel, data);
  }

  /**
   * Listen for messages from the Main process.
   */
  on(channel: string, listener: (...args: any[]) => void): void {
    if (!runtimeConfig.isDesktop || !window.electron) {
      console.warn(`[IPC] 'on' called on '${channel}' but not in Desktop mode.`);
      return;
    }

    // Note: A real implementation needs an 'off' method to remove listeners to prevent leaks
    window.electron.receive(channel, listener);
  }
}

export const ipc = IPCService.getInstance();
