import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// In design mode the whole flow is previewed without a backend, so
// token-based redirects would fight the simulation.
const DESIGN_MODE = process.env.NEXT_PUBLIC_DESIGN_MODE === "true";

/**
 * No locale routing here, deliberately.
 *
 * This app uses next-intl *without* i18n routing: `i18n/request.ts` resolves
 * the locale from the request and `I18nProvider` hands the messages to the
 * tree, so no URL carries a locale and there is no `app/[locale]` segment.
 * `createMiddleware` assumes the opposite - it rewrote `/` to `/en`, which
 * matched no route and made the landing page a 404 while every other path,
 * being already unprefixed, went through untouched.
 */
export function proxy(request: NextRequest) {
  if (DESIGN_MODE) {
    return NextResponse.next();
  }

  return handleAuth(request);
}

function handleAuth(request: NextRequest) {
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
  matcher: ["/((?!api|_next|.*\..*|favicon\.ico|images).*)"],
};
