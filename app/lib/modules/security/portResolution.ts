import net from 'node:net';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('PortResolution');

/**
 * Windows Desktop Subsystem: Port Conflict Resolution
 * Ensures the application can find an available port if the default is occupied.
 */
export class PortResolution {
  private static _instance: PortResolution;

  private constructor() {}

  static getInstance(): PortResolution {
    if (!PortResolution._instance) {
      PortResolution._instance = new PortResolution();
    }
    return PortResolution._instance;
  }

  /**
   * Checks if a port is available.
   */
  async isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer();

      server.once('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          resolve(false);
        } else {
          resolve(false);
        }
      });

      server.once('listening', () => {
        server.close();
        resolve(true);
      });

      server.listen(port, '127.0.0.1');
    });
  }

  /**
   * Finds the next available port in a range.
   */
  async findAvailablePort(startPort: number, maxRetries: number = 10): Promise<number> {
    let currentPort = startPort;
    let attempts = 0;

    while (attempts < maxRetries) {
      const available = await this.isPortAvailable(currentPort);

      if (available) {
        logger.info(`Found available port: ${currentPort}`);
        return currentPort;
      }

      logger.warn(`Port ${currentPort} is occupied. Retrying next...`);
      currentPort++;
      attempts++;
    }

    throw new Error(`Failed to find an available port after ${maxRetries} attempts.`);
  }
}

export const portResolution = PortResolution.getInstance();
