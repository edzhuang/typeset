import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/my-projects",
  "/shared-with-me",
  "/project(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (req.nextUrl.pathname === "/") {
    const { userId } = await auth();

    if (userId) {
      const redirectUrl = new URL("/my-projects", req.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/", "/my-projects", "/shared-with-me", "/project/:path*", "/api/:path*"],
};
