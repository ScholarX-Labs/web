import type { Metadata } from "next";
import type { Locale } from "./locales";
import { DEFAULT_LOCALE, LOCALE_CONFIG } from "./locales";

interface LocalizedMetadataArgs {
  locale: Locale;
  title: string;
  description: string;
  pathname: string;
}

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";
}

export function buildLocalizedPath(pathname: string, locale: Locale) {
  if (locale === DEFAULT_LOCALE) return pathname;
  return pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
}

export function generateLocalizedMetadata({
  locale,
  title,
  description,
  pathname,
}: LocalizedMetadataArgs): Metadata {
  const baseUrl = getBaseUrl();
  const canonical = buildLocalizedPath(pathname, locale);
  const englishPath = buildLocalizedPath(pathname, "en");
  const arabicPath = buildLocalizedPath(pathname, "ar");

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        en: englishPath,
        ar: arabicPath,
        "x-default": englishPath,
      },
    },
    openGraph: {
      title,
      description,
      locale: locale === "ar" ? "ar_EG" : "en_US",
      alternateLocale: locale === "ar" ? ["en_US"] : ["ar_EG"],
      url: baseUrl ? `${baseUrl}${canonical}` : canonical,
    },
  };
}

export function getLangTag(locale: Locale) {
  return LOCALE_CONFIG[locale].bcp47Tag;
}
