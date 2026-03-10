import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "better-auth.session_token";
const SECURE_SESSION_COOKIE_NAME = `__Secure-${SESSION_COOKIE_NAME}`;

const AUTH_ROUTES = new Set<string>(["/signin", "/signup"]);
const PROTECTED_ROUTES = new Set<string>([]);

function hasSessionCookie(request: NextRequest) {
  return Boolean(
    request.cookies.get(SESSION_COOKIE_NAME)?.value ||
    request.cookies.get(SECURE_SESSION_COOKIE_NAME)?.value,
  );
}

export function proxy(request: NextRequest) {
  const isAuthenticated = hasSessionCookie(request);
  const { pathname } = request.nextUrl;
  if (AUTH_ROUTES.has(pathname) && isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (PROTECTED_ROUTES.has(pathname) && !isAuthenticated) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/signin", "/signup"],
};
