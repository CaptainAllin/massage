import { useUser } from '@clerk/nextjs';
import { UserRole } from '@massage/types';

export interface UseRoleReturn {
  role: UserRole | null;
  isSuperAdmin: boolean;
  isBusinessOwner: boolean;
  isReceptionist: boolean;
  isTherapist: boolean;
  isClient: boolean;
  can: (allowedRoles: UserRole[]) => boolean;
  isLoading: boolean;
}

/**
 * React hook for role-based access control
 * Uses Clerk's useUser hook to get user data and role from public metadata
 *
 * @example
 * ```tsx
 * const { role, isBusinessOwner, can } = useRole();
 *
 * if (can([UserRole.BUSINESS_OWNER, UserRole.RECEPTIONIST])) {
 *   return <AdminDashboard />;
 * }
 * ```
 */
export function useRole(): UseRoleReturn {
  const { user, isLoaded } = useUser();

  // Get role from Clerk's public metadata
  const role = (user?.publicMetadata?.role as UserRole) || null;

  return {
    role,
    isSuperAdmin: role === UserRole.SUPER_ADMIN,
    isBusinessOwner: role === UserRole.BUSINESS_OWNER,
    isReceptionist: role === UserRole.RECEPTIONIST,
    isTherapist: role === UserRole.THERAPIST,
    isClient: role === UserRole.CLIENT,
    can: (allowedRoles: UserRole[]) => {
      if (!role) return false;
      return allowedRoles.includes(role);
    },
    isLoading: !isLoaded,
  };
}
