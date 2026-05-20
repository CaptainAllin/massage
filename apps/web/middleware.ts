import { authMiddleware } from '@clerk/nextjs';

// Clerk authentication middleware
// Protects all routes except public ones
export default authMiddleware({
  publicRoutes: [
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/webhooks(.*)',
  ],
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
