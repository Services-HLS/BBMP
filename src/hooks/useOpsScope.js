import { useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../constants';

/**
 * Role-based ops data scope:
 * - Admin: full access (all wards)
 * - Supervisor: only assigned wardIds (e.g. 112, 113, 114)
 */
export default function useOpsScope() {
  const { user, role, isSupervisor, isAdmin } = useAuth();

  const allowedWardIds = useMemo(() => {
    if (role === ROLES.SUPERVISOR && user?.wardIds?.length) {
      return new Set(user.wardIds);
    }
    return null; // null = unrestricted (admin / others)
  }, [role, user?.wardIds]);

  const isScoped = Boolean(allowedWardIds);

  const inScope = useCallback((wardId) => {
    if (!allowedWardIds) return true;
    if (!wardId) return false;
    return allowedWardIds.has(wardId);
  }, [allowedWardIds]);

  const filterByWard = useCallback((rows, key = 'wardId') => {
    if (!allowedWardIds || !rows) return rows || [];
    return rows.filter((row) => allowedWardIds.has(row?.[key]));
  }, [allowedWardIds]);

  const scopeWards = useCallback((wards = []) => {
    if (!allowedWardIds) return wards;
    return wards.filter((w) => allowedWardIds.has(w.id));
  }, [allowedWardIds]);

  const scopeBlocks = useCallback((blocks = []) => {
    if (!allowedWardIds) return blocks;
    return blocks.filter((b) => allowedWardIds.has(b.wardId));
  }, [allowedWardIds]);

  const scopeLabel = isScoped
    ? `Supervisor scope: wards ${(user?.wardIds || []).map((id) => id.replace('ward-', '')).join(', ')}`
    : 'Admin scope: all wards';

  return {
    user,
    role,
    isSupervisor,
    isAdmin,
    isScoped,
    allowedWardIds,
    allowedWardIdList: user?.wardIds || null,
    inScope,
    filterByWard,
    scopeWards,
    scopeBlocks,
    scopeLabel,
  };
}
