import { redirect } from '@remix-run/node';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('RBACGuard');

export type UserRole = 'admin' | 'editor' | 'viewer';
export type Perm = 'read:project' | 'write:project' | 'deploy' | 'manage:secrets';

const ROLE_PERMISSIONS: Record<UserRole, Perm[]> = {
  admin: ['read:project', 'write:project', 'deploy', 'manage:secrets'],
  editor: ['read:project', 'write:project', 'deploy'],
  viewer: ['read:project'],
};

export async function requirePermission(request: Request, requiredPerm: Perm) {
  /*
   * In a real app, we'd decode the session/JWT here.
   * For this audit/upgrade, we assume a header or cookie mocking the role,
   * or default to 'viewer' if not present for safety (Zero Trust).
   */

  const roleHeader = request.headers.get('x-user-role') as UserRole | null;
  const role = roleHeader || 'viewer'; // Default to least privilege

  const perms = ROLE_PERMISSIONS[role] || [];

  if (!perms.includes(requiredPerm)) {
    logger.warn(`Access denied for role '${role}' acting on '${requiredPerm}'`);
    throw new Response('Forbidden: Insufficient Permissions', { status: 403 });
  }

  return { role };
}
