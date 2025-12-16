import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  '/', 
  '/api/generate'
]);

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) {
     // The 'as any' tells TypeScript to ignore errors and just run it
     (auth() as any).protect();
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
