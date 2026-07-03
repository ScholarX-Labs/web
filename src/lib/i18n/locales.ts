export const SUPPORTED_LOCALES = ["en", "ar"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const RTL_LOCALES: ReadonlySet<Locale> = new Set<Locale>(["ar"]);

export interface LocaleConfig {
  readonly code: Locale;
  readonly label: string;
  readonly nativeLabel: string;
  readonly dir: "ltr" | "rtl";
  readonly isDefault: boolean;
  readonly bcp47Tag: string;
}

export const LOCALE_CONFIG: Readonly<Record<Locale, LocaleConfig>> = {
  en: {
    code: "en",
    label: "EN",
    nativeLabel: "English",
    dir: "ltr",
    isDefault: true,
    bcp47Tag: "en-US",
  },
  ar: {
    code: "ar",
    label: "عر",
    nativeLabel: "العربية",
    dir: "rtl",
    isDefault: false,
    bcp47Tag: "ar-EG",
  },
} as const;

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" &&
    (SUPPORTED_LOCALES as readonly string[]).includes(value)
  );
}

export function getDir(locale: Locale): "ltr" | "rtl" {
  return RTL_LOCALES.has(locale) ? "rtl" : "ltr";
}

export function isRTL(locale: Locale): boolean {
  return RTL_LOCALES.has(locale);
}
