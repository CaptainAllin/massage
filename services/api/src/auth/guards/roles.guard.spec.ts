import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserRole } from '@massage/types';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const createMockExecutionContext = (user: any, roles?: UserRole[]): ExecutionContext => {
    const mockContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(roles);

    return mockContext;
  };

  it('should allow access when no roles are required', () => {
    const context = createMockExecutionContext({ role: UserRole.CLIENT }, undefined);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when user has required role', () => {
    const user = { role: UserRole.BUSINESS_OWNER };
    const context = createMockExecutionContext(user, [UserRole.BUSINESS_OWNER, UserRole.SUPER_ADMIN]);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access when user does not have required role', () => {
    const user = { role: UserRole.CLIENT };
    const context = createMockExecutionContext(user, [UserRole.BUSINESS_OWNER]);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should deny access when user is not authenticated', () => {
    const context = createMockExecutionContext(null, [UserRole.BUSINESS_OWNER]);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
