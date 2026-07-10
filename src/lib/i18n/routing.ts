import { defineRouting } from "next-intl/routing";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from "./locales";

const isArabicActive =
  process.env.ARABIC_ENABLED !== "false" &&
  process.env.NEXT_PUBLIC_ARABIC_ENABLED !== "false";

export const routing = defineRouting({
  locales: isArabicActive ? [...SUPPORTED_LOCALES] : [DEFAULT_LOCALE],
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: "as-needed",
});

export function getLocalizedPathname(
  pathname: string,
  locale: Locale,
): string {
  if (locale === DEFAULT_LOCALE) {
    return pathname;
  }

  return pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
}
