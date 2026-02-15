import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('TenantGuard');

/**
 * Security Subsystem: Tenant Isolation Guards
 * Enforces data boundaries between users/tenants.
 */
export class TenantGuard {
  private static _instance: TenantGuard;

  private constructor() {}

  static getInstance(): TenantGuard {
    if (!TenantGuard._instance) {
      TenantGuard._instance = new TenantGuard();
    }
    return TenantGuard._instance;
  }

  /**
   * Validates that a resource belongs to the current tenant context.
   */
  validateAccess(tenantId: string, resourceTenantId: string): boolean {
    if (tenantId !== resourceTenantId) {
      logger.error(`Security Breach: Tenant Isolation Violation! ${tenantId} tried to access ${resourceTenantId}`);
      throw new Error('Access Denied: Resource belongs to a different tenant.');
    }

    return true;
  }

  /**
   * Wraps a query to automatically filter by tenantId.
   */
  enforceIsolation<T>(tenantId: string, items: T[], tenantIdKey: keyof T = 'tenantId' as any): T[] {
    return items.filter(item => item[tenantIdKey] === tenantId);
  }
}

export const tenantGuard = TenantGuard.getInstance();
