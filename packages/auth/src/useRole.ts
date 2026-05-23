import { useAuth } from './AuthProvider';
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
 * Uses Supabase Auth context to get user data and role from user_metadata
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
  const { user, loading } = useAuth();

  // Get role from Supabase user's user_metadata
  const role = (user?.user_metadata?.role as UserRole) || null;

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
    isLoading: loading,
  };
}
