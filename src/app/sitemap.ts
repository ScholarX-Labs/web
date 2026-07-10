import { getLocalizedPublicEntries } from "@/lib/i18n/route-inventory";
import { buildLocalizedPath } from "@/lib/i18n/metadata";
import { SUPPORTED_LOCALES } from "@/lib/i18n/locales";

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";
}

export default function sitemap() {
  const baseUrl = getBaseUrl();

  return getLocalizedPublicEntries()
    .filter((entry) => !entry.englishPath.includes("["))
    .flatMap((entry) =>
      SUPPORTED_LOCALES.map((locale) => ({
        url: `${baseUrl}${buildLocalizedPath(entry.englishPath, locale)}`,
        lastModified: new Date(),
        alternates: {
          languages: {
            en: `${baseUrl}${buildLocalizedPath(entry.englishPath, "en")}`,
            ar: `${baseUrl}${buildLocalizedPath(entry.englishPath, "ar")}`,
          },
        },
      })),
    );
}
