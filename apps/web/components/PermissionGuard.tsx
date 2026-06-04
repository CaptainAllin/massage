'use client';

import { useBusinessId } from '@/lib/hooks/use-business-id';
import { usePermissions } from '@/lib/hooks/use-permissions';
import type { Permission } from '@/lib/permissions';
import AccessDenied from '@/app/(dashboard)/access-denied/AccessDenied';

interface PermissionGuardProps {
  permission: Permission;
  children: React.ReactNode;
}

/**
 * 6.3.3 — Guards a dashboard page by required permission.
 * Shows the access-denied view if the user lacks the permission.
 * Shows nothing (null) while permissions are loading to avoid flicker.
 */
export function PermissionGuard({ permission, children }: PermissionGuardProps) {
  const businessId = useBusinessId();
  const { can, isLoading } = usePermissions(businessId);

  if (isLoading) return null;
  if (!can(permission)) return <AccessDenied permission={permission} />;
  return <>{children}</>;
}
