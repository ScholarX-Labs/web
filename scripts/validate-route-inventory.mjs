import { readdirSync } from "node:fs";
import path from "node:path";

const ROUTE_INVENTORY = [
  { routeId: "home", englishPath: "/", status: "localized", arabicPath: "/ar" },
  { routeId: "about", englishPath: "/about", status: "localized", arabicPath: "/ar/about" },
  { routeId: "contact", englishPath: "/contact", status: "localized", arabicPath: "/ar/contact" },
  { routeId: "courses.index", englishPath: "/courses", status: "localized", arabicPath: "/ar/courses" },
  { routeId: "courses.detail", englishPath: "/courses/[slug]", status: "localized", arabicPath: "/ar/courses/[slug]" },
  { routeId: "courses.leaderboard", englishPath: "/courses/[slug]/leaderboard", status: "localized", arabicPath: "/ar/courses/[slug]/leaderboard" },
  { routeId: "courses.lessons", englishPath: "/courses/[slug]/lessons", status: "localized", arabicPath: "/ar/courses/[slug]/lessons" },
  { routeId: "courses.lessonDetail", englishPath: "/courses/[slug]/lessons/[lessonId]", status: "localized", arabicPath: "/ar/courses/[slug]/lessons/[lessonId]" },
  { routeId: "opportunities.index", englishPath: "/opportunities", status: "localized", arabicPath: "/ar/opportunities" },
  { routeId: "opportunities.detail", englishPath: "/opportunity/[id]", status: "localized", arabicPath: "/ar/opportunity/[id]" },
  { routeId: "certificates.index", englishPath: "/certificates", status: "localized", arabicPath: "/ar/certificates" },
  { routeId: "certificates.verify", englishPath: "/certificates/[certificateNumber]", status: "localized", arabicPath: "/ar/certificates/[certificateNumber]" },
  { routeId: "certificates.download", englishPath: "/certificates/[certificateNumber]/download", status: "english_only" },
  { routeId: "aiSearch.index", englishPath: "/ai-search", status: "localized", arabicPath: "/ar/ai-search" },
  { routeId: "profile.index", englishPath: "/profile", status: "localized", arabicPath: "/ar/profile" },
  { routeId: "scholar.publicProfile", englishPath: "/scholar/[username]", status: "localized", arabicPath: "/ar/scholar/[username]" },
  { routeId: "auth.signup", englishPath: "/auth/signup", status: "localized", arabicPath: "/ar/auth/signup" },
  { routeId: "auth.signin", englishPath: "/auth/signin", status: "localized", arabicPath: "/ar/auth/signin" },
  { routeId: "auth.forgotPassword", englishPath: "/auth/forgot-password", status: "localized", arabicPath: "/ar/auth/forgot-password" },
  { routeId: "auth.resetPassword", englishPath: "/auth/reset-password", status: "localized", arabicPath: "/ar/auth/reset-password" },
  { routeId: "auth.verifyEmail", englishPath: "/auth/verify-email", status: "localized", arabicPath: "/ar/auth/verify-email" },
  { routeId: "auth.collectPhone", englishPath: "/auth/collect-phone", status: "localized", arabicPath: "/ar/auth/collect-phone" },
  { routeId: "admin.*", englishPath: "/admin/*", status: "admin_only" },
  { routeId: "api.*", englishPath: "/api/*", status: "api_only" },
  { routeId: "ingest.*", englishPath: "/ingest/*", status: "api_only" },
  { routeId: "sentryTest", englishPath: "/sentry-test", status: "diagnostic_only" },
];

function getPageFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return getPageFiles(absolutePath);
    }

    return entry.isFile() && entry.name === "page.tsx" ? [absolutePath] : [];
  });
}

function normalizeAppRoute(file) {
  const relativePath = path.relative(
    path.join(process.cwd(), "src", "app"),
    file,
  );

  const withoutPage = relativePath
    .replace(/\\page\.tsx$/, "")
    .replace(/\/page\.tsx$/, "")
    .replace(/^page\.tsx$/, "");
  const unixPath = withoutPage.replaceAll("\\", "/");

  if (!unixPath) {
    return "/";
  }

  return `/${unixPath.replace(/\(platform\)\//g, "").replace(/\/page$/, "")}`;
}

function toMatcher(pathname) {
  return pathname.replace(/\[[^\]]+\]/g, "*");
}

function isCovered(routePath, entry) {
  const candidate = toMatcher(routePath);
  const english = toMatcher(entry.englishPath);

  if (entry.status === "localized" || entry.status === "english_only") {
    return candidate === english;
  }

  return (
    (entry.status === "admin_only" && candidate.startsWith("/admin")) ||
    (entry.status === "api_only" &&
      (candidate.startsWith("/api") || candidate.startsWith("/ingest"))) ||
    (entry.status === "diagnostic_only" && candidate.startsWith("/sentry-test"))
  );
}

const pageFiles = getPageFiles(path.join(process.cwd(), "src", "app")).filter(
  (file) => !file.includes(`${path.sep}[locale]${path.sep}`),
);

const uncovered = pageFiles
  .map(normalizeAppRoute)
  .filter(
    (routePath) => !ROUTE_INVENTORY.some((entry) => isCovered(routePath, entry)),
  );

const invalidArabicEntries = ROUTE_INVENTORY.filter(
  (entry) =>
    entry.status === "localized" &&
    (!entry.arabicPath || !entry.arabicPath.startsWith("/ar")),
);

const invalidExcludedEntries = ROUTE_INVENTORY.filter(
  (entry) =>
    ["admin_only", "api_only", "diagnostic_only"].includes(entry.status) &&
    entry.arabicPath,
);

if (
  uncovered.length > 0 ||
  invalidArabicEntries.length > 0 ||
  invalidExcludedEntries.length > 0
) {
  if (uncovered.length > 0) {
    console.error(`[FAIL] Unclassified routes: ${uncovered.join(", ")}`);
  }

  if (invalidArabicEntries.length > 0) {
    console.error(
      `[FAIL] Localized routes missing Arabic paths: ${invalidArabicEntries
        .map((entry) => entry.routeId)
        .join(", ")}`,
    );
  }

  if (invalidExcludedEntries.length > 0) {
    console.error(
      `[FAIL] Excluded routes must not define Arabic paths: ${invalidExcludedEntries
        .map((entry) => entry.routeId)
        .join(", ")}`,
    );
  }

  process.exit(1);
}

console.log("Route inventory validation passed.");
