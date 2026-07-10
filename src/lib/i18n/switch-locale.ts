import type { Locale } from "./locales";
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from "./locales";

const FALLBACK_ROUTES: Array<{ pattern: RegExp; fallback: string }> = [
  {
    pattern: /^\/certificates\/[^/]+\/download$/,
    fallback: "/certificates",
  },
];

function stripLocalePrefix(raw: string): string {
  for (const code of SUPPORTED_LOCALES) {
    if (code === DEFAULT_LOCALE) continue;
    const prefix = `/${code}`;
    if (raw === prefix) return "/";
    if (raw.startsWith(prefix + "/")) return raw.slice(prefix.length);
  }
  return raw;
}

export function resolveLocaleSwitchPathname(
  pathname: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _locale: Locale,
): string {
  const normalizedPathname = stripLocalePrefix(pathname || "/");
  const fallbackMatch = FALLBACK_ROUTES.find(({ pattern }) =>
    pattern.test(normalizedPathname),
  );
  return fallbackMatch ? fallbackMatch.fallback : normalizedPathname;
}
