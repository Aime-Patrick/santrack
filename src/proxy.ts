import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// In design mode the whole flow is previewed without a backend, so
// token-based redirects would fight the simulation.
const DESIGN_MODE = process.env.NEXT_PUBLIC_DESIGN_MODE === "true";

export function proxy(request: NextRequest) {
  if (DESIGN_MODE) {
    return NextResponse.next();
  }

  const token = request.cookies.get("auth_token")?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isProtectedPage =
    pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding");

  if (isProtectedPage && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding", "/login", "/register"],
};
