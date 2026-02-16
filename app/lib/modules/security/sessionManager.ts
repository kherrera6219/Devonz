import { createScopedLogger } from '~/utils/logger';
import crypto from 'node:crypto';

const logger = createScopedLogger('SessionManager');

export interface Session {
  id: string;
  userId: string;
  role: string;
  createdAt: string;
  expiresAt: string;
}

/**
 * Security Subsystem: Session Management Framework
 * Manages user sessions, lifecycle, and security validation.
 */
export class SessionManager {
  private static _instance: SessionManager;
  private _sessions: Map<string, Session> = new Map();

  private constructor() {
    // Singleton
  }

  static getInstance(): SessionManager {
    if (!SessionManager._instance) {
      SessionManager._instance = new SessionManager();
    }

    return SessionManager._instance;
  }

  /**
   * Creates a new session for a user.
   */
  createSession(userId: string, role: string): Session {
    const session: Session = {
      id: crypto.randomBytes(32).toString('hex'),
      userId,
      role,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h expiry
    };

    this._sessions.set(session.id, session);
    logger.info(`Session created for user ${userId} (${role})`);

    return session;
  }

  /**
   * Validates a session ID.
   */
  validateSession(sessionId: string): Session | null {
    const session = this._sessions.get(sessionId);

    if (!session) {
      return null;
    }

    if (new Date(session.expiresAt).getTime() < Date.now()) {
      logger.warn(`Session ${sessionId} expired.`);
      this.destroySession(sessionId);

      return null;
    }

    return session;
  }

  /**
   * Destroys a session.
   */
  destroySession(sessionId: string): void {
    this._sessions.delete(sessionId);
    logger.info(`Session ${sessionId} destroyed.`);
  }
}

export const sessionManager = SessionManager.getInstance();
