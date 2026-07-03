import { getRequestConfig } from "next-intl/server";
import {
  DEFAULT_LOCALE,
  isLocale,
  type Locale,
} from "./locales";

export const MESSAGE_NAMESPACES = [
  "common",
  "home",
  "courses",
  "auth",
  "profile",
  "about",
  "contact",
  "certificates",
  "opportunities",
  "aiSearch",
  "metadata",
  "email",
  "leaderboard",
] as const;

export type MessageNamespace = (typeof MESSAGE_NAMESPACES)[number];

export type AppMessages = Record<MessageNamespace, Record<string, unknown>>;

const reportedGaps = new Set<string>();

function findKeysGap(
  enObj: Record<string, any>,
  locObj: Record<string, any>,
  path = ""
): string[] {
  const missing: string[] = [];
  if (!enObj || typeof enObj !== "object" || !locObj || typeof locObj !== "object") {
    return missing;
  }
  for (const key in enObj) {
    const fullPath = path ? `${path}.${key}` : key;
    if (!(key in locObj)) {
      missing.push(fullPath);
    } else if (
      enObj[key] && typeof enObj[key] === "object" &&
      locObj[key] && typeof locObj[key] === "object"
    ) {
      missing.push(...findKeysGap(enObj[key], locObj[key], fullPath));
    }
  }
  return missing;
}

export async function loadMessages(locale: Locale): Promise<AppMessages> {
  const resolvedLocale = isLocale(locale) ? locale : DEFAULT_LOCALE;

  const loaded = await Promise.all(
    MESSAGE_NAMESPACES.map(async (namespace) => {
      const mod = await import(`../../messages/${resolvedLocale}/${namespace}.json`);
      return [namespace, mod.default] as const;
    }),
  );

  const messages = Object.fromEntries(loaded) as AppMessages;

  if (resolvedLocale !== "en") {
    try {
      const enMessages = await loadMessages("en");
      const gap = findKeysGap(enMessages, messages);
      if (gap.length > 0 && !reportedGaps.has(resolvedLocale)) {
        reportedGaps.add(resolvedLocale);
        console.warn(
          JSON.stringify({
            event: "i18n_translation_gap",
            locale: resolvedLocale,
            missingKeysCount: gap.length,
            missingKeys: gap,
            timestamp: Date.now(),
          })
        );
      }
    } catch (e) {
      console.error("Failed to perform i18n gap analysis:", e);
    }
  }

  return messages;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requestedLocale = await requestLocale;
  const locale = isLocale(requestedLocale) ? requestedLocale : DEFAULT_LOCALE;

  return {
    locale,
    messages: await loadMessages(locale),
    timeZone: "UTC",
  };
});
