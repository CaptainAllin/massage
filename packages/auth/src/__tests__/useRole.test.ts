import { renderHook } from '@testing-library/react';
import { useRole } from '../useRole';
import { UserRole } from '@massage/types';

// Mock our useAuth hook
jest.mock('../AuthProvider', () => ({
  useAuth: jest.fn(),
}));

import { useAuth } from '../AuthProvider';

describe('useRole', () => {
  const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return null role when user is not loaded', () => {
    mockUseAuth.mockReturnValue({
      loading: true,
      user: null,
      signOut: jest.fn(),
    });

    const { result } = renderHook(() => useRole());

    expect(result.current.role).toBeNull();
    expect(result.current.isLoading).toBe(true);
  });

  it('should return role from user metadata', () => {
    mockUseAuth.mockReturnValue({
      loading: false,
      user: {
        user_metadata: {
          role: UserRole.BUSINESS_OWNER,
        },
      } as any,
      signOut: jest.fn(),
    });

    const { result } = renderHook(() => useRole());

    expect(result.current.role).toBe(UserRole.BUSINESS_OWNER);
    expect(result.current.isBusinessOwner).toBe(true);
    expect(result.current.isClient).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('should correctly check role permissions with can()', () => {
    mockUseAuth.mockReturnValue({
      loading: false,
      user: {
        user_metadata: {
          role: UserRole.THERAPIST,
        },
      } as any,
      signOut: jest.fn(),
    });

    const { result } = renderHook(() => useRole());

    expect(result.current.can([UserRole.THERAPIST, UserRole.BUSINESS_OWNER])).toBe(true);
    expect(result.current.can([UserRole.BUSINESS_OWNER])).toBe(false);
  });

  it('should return false for can() when no role', () => {
    mockUseAuth.mockReturnValue({
      loading: false,
      user: {
        user_metadata: {},
      } as any,
      signOut: jest.fn(),
    });

    const { result } = renderHook(() => useRole());

    expect(result.current.can([UserRole.BUSINESS_OWNER])).toBe(false);
  });
});
