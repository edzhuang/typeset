import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, NextRequest } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/my-projects",
  "/shared-with-me",
  "/project(.*)",
]);

// Public routes that should bypass Clerk middleware entirely
const isPublicRoute = createRouteMatcher([
  "/",
  "/home",
  "/privacy",
  "/terms",
]);

// Wrap clerkMiddleware to skip it entirely for public routes
const clerk = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export default function middleware(req: NextRequest) {
  // Skip Clerk middleware entirely for public marketing routes
  // This prevents slow Clerk API calls from blocking page load on cold starts
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  return clerk(req, {} as any);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
