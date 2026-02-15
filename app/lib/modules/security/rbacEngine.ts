import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('RBACEngine');

export type UserRole = 'ADMIN' | 'DEVELOPER' | 'VIEWER';

export type Permission =
  | 'read:project'
  | 'write:project'
  | 'delete:project'
  | 'manage:secrets'
  | 'execute:tools'
  | 'view:analytics'
  | 'manage:users';

interface RoleDefinition {
  permissions: Permission[];
}

/**
 * Security Subsystem: RBAC Enforcement Engine
 * Manages role-based access control and permission validation.
 */
export class RBACEngine {
  private static _instance: RBACEngine;

  private readonly _roles: Record<UserRole, RoleDefinition> = {
    ADMIN: {
      permissions: [
        'read:project', 'write:project', 'delete:project',
        'manage:secrets', 'execute:tools', 'view:analytics', 'manage:users'
      ],
    },
    DEVELOPER: {
      permissions: [
        'read:project', 'write:project', 'execute:tools', 'view:analytics'
      ],
    },
    VIEWER: {
      permissions: [
        'read:project', 'view:analytics'
      ],
    },
  };

  private constructor() {}

  static getInstance(): RBACEngine {
    if (!RBACEngine._instance) {
      RBACEngine._instance = new RBACEngine();
    }
    return RBACEngine._instance;
  }

  /**
   * Checks if a user with a given role has a specific permission.
   */
  can(role: UserRole, permission: Permission): boolean {
    const roleDef = this._roles[role];
    const hasPermission = roleDef?.permissions.includes(permission) || false;

    if (!hasPermission) {
      logger.warn(`Access Denied: Role '${role}' missing permission '${permission}'`);
    }

    return hasPermission;
  }

  /**
   * Gets all permissions for a specific role.
   */
  getPermissions(role: UserRole): Permission[] {
    return this._roles[role]?.permissions || [];
  }
}

export const rbacEngine = RBACEngine.getInstance();
