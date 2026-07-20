import {
  DEFAULT_LOCALE,
  type Locale,
  type LocaleConfig,
  LOCALE_CONFIG,
} from "./locales";

export type RouteStatus =
  | "localized"
  | "english_only"
  | "admin_only"
  | "api_only"
  | "diagnostic_only"
  | "deferred";

export type AuthBoundary =
  | "public"
  | "authenticated"
  | "admin"
  | "api"
  | "internal";

export type MessageNamespaceKey =
  | "common"
  | "home"
  | "auth"
  | "courses"
  | "certificates"
  | "opportunities"
  | "profile"
  | "about"
  | "contact"
  | "aiSearch"
  | "metadata"
  | "email"
  | "leaderboard";

export interface LocalizedRouteInventoryEntry {
  routeId: string;
  englishPath: string;
  arabicPath?: string;
  status: RouteStatus;
  authBoundary: AuthBoundary;
  messagesRequired: MessageNamespaceKey[];
  metadataRequired: boolean;
  visualQaRequired: boolean;
  migrationBatch?: "A" | "B" | "C" | "D" | "E";
  notes?: string;
}

export const ROUTE_INVENTORY: readonly LocalizedRouteInventoryEntry[] = [
  {
    routeId: "home",
    englishPath: "/",
    arabicPath: "/ar",
    status: "localized",
    authBoundary: "public",
    messagesRequired: ["common", "home", "metadata"],
    metadataRequired: true,
    visualQaRequired: true,
    migrationBatch: "A",
  },
  {
    routeId: "about",
    englishPath: "/about",
    arabicPath: "/ar/about",
    status: "localized",
    authBoundary: "public",
    messagesRequired: ["common", "about", "metadata"],
    metadataRequired: true,
    visualQaRequired: true,
    migrationBatch: "A",
  },
  {
    routeId: "contact",
    englishPath: "/contact",
    arabicPath: "/ar/contact",
    status: "localized",
    authBoundary: "public",
    messagesRequired: ["common", "contact", "metadata"],
    metadataRequired: true,
    visualQaRequired: true,
    migrationBatch: "A",
  },
  {
    routeId: "courses.index",
    englishPath: "/courses",
    arabicPath: "/ar/courses",
    status: "localized",
    authBoundary: "public",
    messagesRequired: ["common", "courses", "metadata"],
    metadataRequired: true,
    visualQaRequired: true,
    migrationBatch: "B",
  },
  {
    routeId: "courses.detail",
    englishPath: "/courses/[slug]",
    arabicPath: "/ar/courses/[slug]",
    status: "localized",
    authBoundary: "public",
    messagesRequired: ["common", "courses", "metadata"],
    metadataRequired: true,
    visualQaRequired: true,
    migrationBatch: "B",
  },
  {
    routeId: "courses.leaderboard",
    englishPath: "/courses/[slug]/leaderboard",
    arabicPath: "/ar/courses/[slug]/leaderboard",
    status: "localized",
    authBoundary: "authenticated",
    messagesRequired: ["common", "courses", "leaderboard", "metadata"],
    metadataRequired: false,
    visualQaRequired: true,
    migrationBatch: "C",
  },
  {
    routeId: "courses.lessons",
    englishPath: "/courses/[slug]/lessons",
    arabicPath: "/ar/courses/[slug]/lessons",
    status: "localized",
    authBoundary: "authenticated",
    messagesRequired: ["common", "courses"],
    metadataRequired: false,
    visualQaRequired: true,
    migrationBatch: "C",
  },
  {
    routeId: "courses.lessonDetail",
    englishPath: "/courses/[slug]/lessons/[lessonId]",
    arabicPath: "/ar/courses/[slug]/lessons/[lessonId]",
    status: "localized",
    authBoundary: "authenticated",
    messagesRequired: ["common", "courses"],
    metadataRequired: false,
    visualQaRequired: true,
    migrationBatch: "C",
  },
  {
    routeId: "opportunities.index",
    englishPath: "/opportunities",
    arabicPath: "/ar/opportunities",
    status: "localized",
    authBoundary: "public",
    messagesRequired: ["common", "opportunities", "metadata"],
    metadataRequired: true,
    visualQaRequired: true,
    migrationBatch: "B",
  },
  {
    routeId: "opportunities.detail",
    englishPath: "/opportunity/[id]",
    arabicPath: "/ar/opportunity/[id]",
    status: "localized",
    authBoundary: "public",
    messagesRequired: ["common", "opportunities", "metadata"],
    metadataRequired: true,
    visualQaRequired: true,
    migrationBatch: "B",
  },
  {
    routeId: "certificates.index",
    englishPath: "/certificates",
    arabicPath: "/ar/certificates",
    status: "localized",
    authBoundary: "authenticated",
    messagesRequired: ["common", "certificates"],
    metadataRequired: false,
    visualQaRequired: true,
    migrationBatch: "C",
  },
  {
    routeId: "certificates.verify",
    englishPath: "/certificates/[certificateNumber]",
    arabicPath: "/ar/certificates/[certificateNumber]",
    status: "localized",
    authBoundary: "public",
    messagesRequired: ["common", "certificates", "metadata"],
    metadataRequired: true,
    visualQaRequired: true,
    migrationBatch: "C",
  },
  {
    routeId: "certificates.download",
    englishPath: "/certificates/[certificateNumber]/download",
    status: "english_only",
    authBoundary: "authenticated",
    messagesRequired: [],
    metadataRequired: false,
    visualQaRequired: false,
  },
  {
    routeId: "aiSearch.index",
    englishPath: "/ai-search",
    arabicPath: "/ar/ai-search",
    status: "localized",
    authBoundary: "public",
    messagesRequired: ["common", "aiSearch", "metadata"],
    metadataRequired: true,
    visualQaRequired: true,
    migrationBatch: "E",
  },
  {
    routeId: "profile.index",
    englishPath: "/profile",
    arabicPath: "/ar/profile",
    status: "localized",
    authBoundary: "authenticated",
    messagesRequired: ["common", "profile"],
    metadataRequired: false,
    visualQaRequired: true,
    migrationBatch: "D",
  },
  {
    routeId: "scholar.publicProfile",
    englishPath: "/scholar/[username]",
    arabicPath: "/ar/scholar/[username]",
    status: "localized",
    authBoundary: "public",
    messagesRequired: ["common", "profile", "metadata"],
    metadataRequired: true,
    visualQaRequired: true,
    migrationBatch: "D",
  },
  {
    routeId: "auth.signup",
    englishPath: "/auth/signup",
    arabicPath: "/ar/auth/signup",
    status: "localized",
    authBoundary: "public",
    messagesRequired: ["common", "auth"],
    metadataRequired: false,
    visualQaRequired: true,
    migrationBatch: "D",
  },
  {
    routeId: "auth.signin",
    englishPath: "/auth/signin",
    arabicPath: "/ar/auth/signin",
    status: "localized",
    authBoundary: "public",
    messagesRequired: ["common", "auth"],
    metadataRequired: false,
    visualQaRequired: true,
    migrationBatch: "D",
  },
  {
    routeId: "auth.forgotPassword",
    englishPath: "/auth/forgot-password",
    arabicPath: "/ar/auth/forgot-password",
    status: "localized",
    authBoundary: "public",
    messagesRequired: ["common", "auth"],
    metadataRequired: false,
    visualQaRequired: true,
    migrationBatch: "D",
  },
  {
    routeId: "auth.resetPassword",
    englishPath: "/auth/reset-password",
    arabicPath: "/ar/auth/reset-password",
    status: "localized",
    authBoundary: "public",
    messagesRequired: ["common", "auth"],
    metadataRequired: false,
    visualQaRequired: true,
    migrationBatch: "D",
  },
  {
    routeId: "auth.verifyEmail",
    englishPath: "/auth/verify-email",
    arabicPath: "/ar/auth/verify-email",
    status: "localized",
    authBoundary: "public",
    messagesRequired: ["common", "auth"],
    metadataRequired: false,
    visualQaRequired: true,
    migrationBatch: "D",
  },
  {
    routeId: "auth.changePassword",
    englishPath: "/auth/change-password",
    arabicPath: "/ar/auth/change-password",
    status: "localized",
    authBoundary: "public",
    messagesRequired: ["common", "auth"],
    metadataRequired: false,
    visualQaRequired: true,
    migrationBatch: "D",
  },
  {
    routeId: "auth.collectPhone",
    englishPath: "/auth/collect-phone",
    arabicPath: "/ar/auth/collect-phone",
    status: "localized",
    authBoundary: "public",
    messagesRequired: ["common", "auth"],
    metadataRequired: false,
    visualQaRequired: true,
    migrationBatch: "D",
  },
  {
    routeId: "admin.*",
    englishPath: "/admin/*",
    status: "admin_only",
    authBoundary: "admin",
    messagesRequired: [],
    metadataRequired: false,
    visualQaRequired: false,
  },
  {
    routeId: "api.*",
    englishPath: "/api/*",
    status: "api_only",
    authBoundary: "api",
    messagesRequired: [],
    metadataRequired: false,
    visualQaRequired: false,
  },
  {
    routeId: "ingest.*",
    englishPath: "/ingest/*",
    status: "api_only",
    authBoundary: "internal",
    messagesRequired: [],
    metadataRequired: false,
    visualQaRequired: false,
  },
  {
    routeId: "sentryTest",
    englishPath: "/sentry-test",
    status: "diagnostic_only",
    authBoundary: "internal",
    messagesRequired: [],
    metadataRequired: false,
    visualQaRequired: false,
  },
] as const;

const ROUTE_ID_LOOKUP = new Map(
  ROUTE_INVENTORY.map((entry) => [entry.routeId, entry]),
);

export function getRouteInventoryEntry(routeId: string) {
  return ROUTE_ID_LOOKUP.get(routeId);
}

export function getLocalizedPublicEntries() {
  return ROUTE_INVENTORY.filter(
    (entry) => entry.status === "localized" && entry.authBoundary === "public",
  );
}

export function getLocalizedRoute(locale: Locale, path: string) {
  if (locale === DEFAULT_LOCALE) {
    return path;
  }

  const config: LocaleConfig = LOCALE_CONFIG[locale];
  return path === "/" ? `/${config.code}` : `/${config.code}${path}`;
}
