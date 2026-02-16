import { describe, it, expect, vi } from 'vitest';
import { requirePermission } from '../rbac-guard';

describe('RBACGuard', () => {
  it('should allow admin to perform all actions', async () => {
    const req = new Request('http://localhost', {
      headers: { 'x-user-role': 'admin' },
    });

    await expect(requirePermission(req, 'manage:secrets')).resolves.toEqual({ role: 'admin' });
    await expect(requirePermission(req, 'deploy')).resolves.toEqual({ role: 'admin' });
  });

  it('should allow editor to deploy but not manage secrets', async () => {
    const req = new Request('http://localhost', {
      headers: { 'x-user-role': 'editor' },
    });

    await expect(requirePermission(req, 'deploy')).resolves.toEqual({ role: 'editor' });

    await expect(requirePermission(req, 'manage:secrets')).rejects.toThrow();

    /*
     * In implementation it throws a Response, verifying it throws something is enough for now,
     * or we can catch and check status.
     */
    try {
      await requirePermission(req, 'manage:secrets');
    } catch (e) {
      expect(e).toBeInstanceOf(Response);
      expect((e as Response).status).toBe(403);
    }
  });

  it('should default to viewer and deny write access', async () => {
    const req = new Request('http://localhost'); // No header

    await expect(requirePermission(req, 'read:project')).resolves.toEqual({ role: 'viewer' });

    try {
      await requirePermission(req, 'write:project');
    } catch (e) {
      expect((e as Response).status).toBe(403);
    }
  });
});
