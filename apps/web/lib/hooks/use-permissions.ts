'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { ROLE_PERMISSIONS, type Permission } from '@/lib/permissions';

interface MemberRoleData {
  role: string;
  /** Fully resolved effective permission list from the server (role + role overrides + member overrides). */
  permissions: string[];
}

/**
 * Fetches the current user's resolved effective permissions for a business.
 * Stale-time is 5 min — role changes are rare enough that a page refresh picks them up.
 */
export function useBusinessMemberRole(businessId: string | undefined) {
  const { data, isLoading } = useQuery<MemberRoleData>({
    queryKey: ['business-member-role', businessId],
    queryFn: async () => {
      const r = await apiClient.get(`/business-members/me?businessId=${businessId}`);
      return (r.data as any).data as MemberRoleData;
    },
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000,
  });

  return {
    role: data?.role ?? null,
    /** Fully resolved effective permissions returned by the server. */
    effectivePermissions: data?.permissions ?? null,
    isLoading,
  };
}

/**
 * 6.0.4 — Hook for frontend permission checks.
 *
 * For OWNER the server returns an empty list; we fall back to ALL permissions.
 *
 * @example
 * const { can } = usePermissions(businessId);
 * if (can('payments:view')) { ... }
 */
export function usePermissions(businessId: string | undefined) {
  const { role, effectivePermissions, isLoading } = useBusinessMemberRole(businessId);

  const permissionSet = useMemo(() => {
    if (!role) return new Set<Permission>();
    if (role === 'OWNER') {
      // Server returns [] for owner — use the static ALL list
      return new Set<Permission>(ROLE_PERMISSIONS['OWNER'] ?? []);
    }
    return new Set<Permission>((effectivePermissions ?? []) as Permission[]);
  }, [role, effectivePermissions]);

  return {
    /** Check if the current user has a specific permission. Returns false while loading. */
    can: (action: Permission): boolean => permissionSet.has(action),
    /** Resolved permission strings for the current user (e.g. for passing to Sidebar). */
    permissions: [...permissionSet] as string[],
    role,
    isLoading,
  };
}
