"use client";

import { NextIntlClientProvider } from "next-intl";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  DEFAULT_LOCALE,
  isLocale,
  LOCALE_CONFIG,
  type Locale,
} from "@/lib/i18n/locales";
import type { AppMessages } from "@/lib/i18n/messages";

function findKeysGap(
  enObj: Record<string, unknown>,
  locObj: Record<string, unknown>,
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
      missing.push(...findKeysGap(enObj[key] as Record<string, unknown>, locObj[key] as Record<string, unknown>, fullPath));
    }
  }
  return missing;
}

export function RootIntlProvider({
  localeMessages,
  children,
}: {
  localeMessages: Partial<Record<Locale, AppMessages>>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const firstSegment = pathname?.split("/").filter(Boolean)[0] ?? "";
  const locale: Locale = isLocale(firstSegment) ? firstSegment : DEFAULT_LOCALE;
  const config = LOCALE_CONFIG[locale];

  // Keep <html> lang and dir in sync with the active locale on client navigation.
  useEffect(() => {
    document.documentElement.lang = config.bcp47Tag;
    document.documentElement.dir = config.dir;
  }, [config]);

  // Client-side translation gap check
  useEffect(() => {
    if (typeof window === "undefined") return;

    const enMessages = localeMessages["en"];
    const activeMessages = localeMessages[locale];
    if (locale !== "en" && enMessages && activeMessages) {
      const gap = findKeysGap(enMessages, activeMessages);
      if (gap.length > 0) {
        console.warn(
          JSON.stringify({
            event: "client_i18n_translation_gap",
            locale,
            missingKeysCount: gap.length,
            missingKeys: gap,
            timestamp: Date.now(),
          })
        );

        // Report to agentLog telemetry
        import("@/lib/debug/agent-log").then(({ agentLog }) => {
          agentLog({
            runId: "i18n-gap-report",
            hypothesisId: "i18n",
            location: "RootIntlProvider",
            message: `i18n gap detected for locale: ${locale}`,
            data: { locale, missingKeys: gap },
            timestamp: Date.now(),
          });
        });
      }
    }
  }, [locale, localeMessages]);

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={localeMessages[locale] ?? {}}
      timeZone="UTC"
    >
      {children}
    </NextIntlClientProvider>
  );
}
