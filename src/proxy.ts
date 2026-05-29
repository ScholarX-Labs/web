import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isDevAuthBypassEnabled } from "@/config/dev-auth-bypass";
import { ROUTES } from "./lib/routes";

const SESSION_COOKIE_NAME = "better-auth.session_token";
const SECURE_SESSION_COOKIE_NAME = `__Secure-${SESSION_COOKIE_NAME}`;

const OPEN_ROUTES = new Set<string>(["/", "/about", "/contact", "/courses"]);
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

export function proxy(request: NextRequest) {
  if (isDevAuthBypassEnabled && process.env.NODE_ENV !== "production") {
    return NextResponse.next();
  }
  const isAuthenticated = hasSessionCookie(request);
  const { pathname } = request.nextUrl;
  const isAuthRoute = pathname.startsWith("/auth");
  const isIngestRoute = pathname === "/ingest" || pathname.startsWith("/ingest/");
  const isPublicRoute = OPEN_ROUTES.has(pathname) || pathname.startsWith("/courses/") || isIngestRoute;
  const isAdminRoute = pathname.startsWith("/admin");

  if (process.env.NODE_ENV === "production") {
    console.info("[proxy]", {
      pathname,
      isAuthenticated,
      isAuthRoute,
      isPublicRoute,
      isAdminRoute,
    });
  }

  if (
    isAuthRoute &&
    isAuthenticated &&
    !ALLOWED_AUTH_ROUTES_FOR_AUTHENTICATED.has(pathname)
  ) {
    if (process.env.NODE_ENV === "production") {
      console.info("[proxy] redirect", {
        pathname,
        target: "/",
        reason: "authenticated-user-on-auth-route",
      });
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isAdminRoute && !isAuthenticated) {
    if (process.env.NODE_ENV === "production") {
      console.info("[proxy] redirect", {
        pathname,
        target: ROUTES.SIGNIN,
        reason: "admin-route-without-session-cookie",
      });
    }
    return NextResponse.redirect(new URL(ROUTES.SIGNIN, request.url));
  }

  if (!isPublicRoute && !isAuthenticated && !isAuthRoute && !isAdminRoute) {
    if (process.env.NODE_ENV === "production") {
      console.info("[proxy] redirect", {
        pathname,
        target: ROUTES.SIGNIN,
        reason: "protected-route-without-session-cookie",
      });
    }
    return NextResponse.redirect(new URL(ROUTES.SIGNIN, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|ingest|_next/static|_next/image|.*\\..*).*)"],
};
