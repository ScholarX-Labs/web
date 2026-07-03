import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { isDevAuthBypassEnabled } from "@/config/dev-auth-bypass";
import { ROUTES } from "./lib/routes";
import { isLocale } from "@/lib/i18n/locales";
import { routing, getLocalizedPathname } from "@/lib/i18n/routing";
import { ROUTE_INVENTORY } from "@/lib/i18n/route-inventory";

const SESSION_COOKIE_NAME = "better-auth.session_token";
const SECURE_SESSION_COOKIE_NAME = `__Secure-${SESSION_COOKIE_NAME}`;
const intlProxy = createMiddleware(routing);

const _publicInventory = ROUTE_INVENTORY.filter(
  (e) => e.authBoundary === "public" && e.status === "localized",
);

// Exact-match paths (no dynamic segments)
const OPEN_ROUTES = new Set<string>(
  _publicInventory
    .filter((e) => !e.englishPath.includes("[") && !e.englishPath.includes("*"))
    .map((e) => e.englishPath),
);

// Static prefixes before the first dynamic segment (e.g. /courses/[slug] → /courses/)
const PUBLIC_PATH_PREFIXES: readonly string[] = [
  ...new Set(
    _publicInventory
      .filter((e) => e.englishPath.includes("["))
      .map((e) => e.englishPath.split("[")[0]!),
  ),
];

const ALLOWED_AUTH_ROUTES_FOR_AUTHENTICATED = new Set<string>([
  ROUTES.PHONE_COLLECTION,
  ROUTES.VERIFY_EMAIL,
]);
const EXCLUDED_PREFIXES = [
  "/api/",
  "/admin/",
  "/ingest/",
  "/_next/",
  "/favicon",
  "/monitoring",
  "/sentry-test",
];

function hasSessionCookie(request: NextRequest) {
  return Boolean(
    request.cookies.get(SESSION_COOKIE_NAME)?.value ||
    request.cookies.get(SECURE_SESSION_COOKIE_NAME)?.value,
  );
}

function isExcluded(pathname: string) {
  return (
    EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    /\.[a-z0-9]+$/i.test(pathname)
  );
}

function getRouteLocale(pathname: string) {
  const [, maybeLocale] = pathname.split("/");
  return isLocale(maybeLocale) ? maybeLocale : routing.defaultLocale;
}

function normalizePathname(pathname: string) {
  const segments = pathname.split("/");
  const maybeLocale = segments[1];

  if (!isLocale(maybeLocale)) {
    return pathname;
  }

  const normalized = `/${segments.slice(2).join("/")}`.replace(/\/+/g, "/");
  return normalized === "/" ? normalized : normalized.replace(/\/$/, "") || "/";
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isDevAuthBypassEnabled && process.env.NODE_ENV !== "production") {
    return NextResponse.next();
  }

  if (isExcluded(pathname)) {
    return NextResponse.next();
  }

  const localizedPathname = normalizePathname(pathname);
  const locale = getRouteLocale(pathname);

  const isArabicActive =
    process.env.ARABIC_ENABLED !== "false" &&
    process.env.NEXT_PUBLIC_ARABIC_ENABLED !== "false";

  if (!isArabicActive && locale === "ar") {
    const target = localizedPathname === "/" ? "/" : localizedPathname;
    return NextResponse.redirect(new URL(target, request.url));
  }

  const [, maybeLocale] = pathname.split("/");
  if (
    maybeLocale &&
    /^[a-z]{2}(-[a-zA-Z]{2,4})?$/.test(maybeLocale) &&
    !isLocale(maybeLocale)
  ) {
    console.warn(
      JSON.stringify({
        event: "unsupported_locale_request",
        requestedLocale: maybeLocale,
        pathname,
        timestamp: Date.now(),
      })
    );
  }
  const isAuthenticated = hasSessionCookie(request);
  const isAuthRoute = localizedPathname.startsWith("/auth");
  const isIngestRoute =
    localizedPathname === "/ingest" || localizedPathname.startsWith("/ingest/");
  const isPublicRoute =
    OPEN_ROUTES.has(localizedPathname) ||
    PUBLIC_PATH_PREFIXES.some((prefix) => localizedPathname.startsWith(prefix)) ||
    isIngestRoute;
  const isAdminRoute = localizedPathname.startsWith("/admin");

  if (process.env.NODE_ENV === "production") {
    console.info("[proxy]", {
      pathname,
      localizedPathname,
      locale,
      isAuthenticated,
      isAuthRoute,
      isPublicRoute,
      isAdminRoute,
    });
  }

  if (
    isAuthRoute &&
    isAuthenticated &&
    !ALLOWED_AUTH_ROUTES_FOR_AUTHENTICATED.has(localizedPathname)
  ) {
    const target = getLocalizedPathname("/", locale);
    if (process.env.NODE_ENV === "production") {
      console.info("[proxy] redirect", {
        pathname,
        target,
        reason: "authenticated-user-on-auth-route",
      });
    }
    return NextResponse.redirect(new URL(target, request.url));
  }

  if (isAdminRoute && !isAuthenticated) {
    const target = getLocalizedPathname(ROUTES.SIGNIN, locale);
    if (process.env.NODE_ENV === "production") {
      console.info("[proxy] redirect", {
        pathname,
        target,
        reason: "admin-route-without-session-cookie",
      });
    }
    return NextResponse.redirect(new URL(target, request.url));
  }

  if (!isPublicRoute && !isAuthenticated && !isAuthRoute && !isAdminRoute) {
    const target = getLocalizedPathname(ROUTES.SIGNIN, locale);
    if (process.env.NODE_ENV === "production") {
      console.info("[proxy] redirect", {
        pathname,
        target,
        reason: "protected-route-without-session-cookie",
      });
    }
    return NextResponse.redirect(new URL(target, request.url));
  }

  // intlProxy is called last so its response headers and locale cookie
  // are always present in the final response (never discarded by a redirect above).
  return intlProxy(request);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
