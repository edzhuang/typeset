import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/my-projects",
  "/shared-with-me",
  "/project(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  // Only run middleware on protected routes and API routes
  // Public marketing pages (/, /home, /privacy, /terms) are NOT matched
  // so middleware never runs for them - no Clerk initialization, instant load
  matcher: [
    "/my-projects",
    "/shared-with-me",
    "/project/:path*",
    "/api/:path*",
  ],
};
