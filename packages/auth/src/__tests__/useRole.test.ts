import { renderHook } from '@testing-library/react';
import { useRole } from '../useRole';
import { UserRole } from '@massage/types';

// Mock Clerk's useUser hook
jest.mock('@clerk/nextjs', () => ({
  useUser: jest.fn(),
}));

import { useUser } from '@clerk/nextjs';

describe('useRole', () => {
  const mockUseUser = useUser as jest.MockedFunction<typeof useUser>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return null role when user is not loaded', () => {
    mockUseUser.mockReturnValue({
      isLoaded: false,
      user: null,
    } as any);

    const { result } = renderHook(() => useRole());

    expect(result.current.role).toBeNull();
    expect(result.current.isLoading).toBe(true);
  });

  it('should return role from user metadata', () => {
    mockUseUser.mockReturnValue({
      isLoaded: true,
      user: {
        publicMetadata: {
          role: UserRole.BUSINESS_OWNER,
        },
      },
    } as any);

    const { result } = renderHook(() => useRole());

    expect(result.current.role).toBe(UserRole.BUSINESS_OWNER);
    expect(result.current.isBusinessOwner).toBe(true);
    expect(result.current.isClient).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('should correctly check role permissions with can()', () => {
    mockUseUser.mockReturnValue({
      isLoaded: true,
      user: {
        publicMetadata: {
          role: UserRole.THERAPIST,
        },
      },
    } as any);

    const { result } = renderHook(() => useRole());

    expect(result.current.can([UserRole.THERAPIST, UserRole.BUSINESS_OWNER])).toBe(true);
    expect(result.current.can([UserRole.BUSINESS_OWNER])).toBe(false);
  });

  it('should return false for can() when no role', () => {
    mockUseUser.mockReturnValue({
      isLoaded: true,
      user: {
        publicMetadata: {},
      },
    } as any);

    const { result } = renderHook(() => useRole());

    expect(result.current.can([UserRole.BUSINESS_OWNER])).toBe(false);
  });
});
