"use client";

import { useLocale } from "next-intl";
import { getDir, isLocale, isRTL, DEFAULT_LOCALE } from "./locales";

export function useDirection(): "ltr" | "rtl" {
  const locale = useLocale();
  const validLocale = isLocale(locale) ? locale : DEFAULT_LOCALE;
  return getDir(validLocale);
}

export function useIsRTL(): boolean {
  const locale = useLocale();
  const validLocale = isLocale(locale) ? locale : DEFAULT_LOCALE;
  return isRTL(validLocale);
}
