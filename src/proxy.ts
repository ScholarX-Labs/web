import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isDevAuthBypassEnabled } from "@/config/dev-auth-bypass";
import { ROUTES } from "./lib/routes";

const SESSION_COOKIE_NAME = "better-auth.session_token";
const SECURE_SESSION_COOKIE_NAME = `__Secure-${SESSION_COOKIE_NAME}`;

const OPEN_ROUTES = new Set<string>([
  "/",
  "/about",
  "/contact",
  "/courses",
  "/opportunities",
]);
const ALLOWED_AUTH_ROUTES_FOR_AUTHENTICATED = new Set<string>([
  ROUTES.PHONE_COLLECTION,
  ROUTES.VERIFY_EMAIL,
]);

function hasSessionCookie(request: NextRequest) {
  return Boolean(
    request.cookies.get(SESSION_COOKIE_NAME)?.value ||
    request.cookies.get(SECURE_SESSION_COOKIE_NAME)?.value,
  );
}

function normalizePath(pathname: string): string {
  return pathname.endsWith("/") && pathname !== "/"
    ? pathname.slice(0, -1)
    : pathname;
}

export function proxy(request: NextRequest) {
  if (isDevAuthBypassEnabled && process.env.NODE_ENV !== "production") {
    return NextResponse.next();
  }
  const isAuthenticated = hasSessionCookie(request);
  const pathname = normalizePath(request.nextUrl.pathname);
  const isAuthRoute = pathname.startsWith("/auth");
  const isPublicRoute =
    OPEN_ROUTES.has(pathname) || pathname.startsWith("/courses/");

  if (
    isAuthRoute &&
    isAuthenticated &&
    !ALLOWED_AUTH_ROUTES_FOR_AUTHENTICATED.has(pathname)
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!isPublicRoute && !isAuthenticated && !isAuthRoute) {
    return NextResponse.redirect(new URL(ROUTES.SIGNIN, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
