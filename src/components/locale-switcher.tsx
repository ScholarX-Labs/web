"use client";

import { startTransition, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { DEFAULT_LOCALE, isLocale, LOCALE_CONFIG, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n/locales";
import { usePathname, useRouter } from "@/lib/i18n/navigation";
import { resolveLocaleSwitchPathname } from "@/lib/i18n/switch-locale";

interface LocaleSwitcherProps {
  className?: string;
}

function detectLocaleFromUrl(): Locale | null {
  if (typeof window === "undefined") return null;
  const match = window.location.pathname.match(/^\/(ar)(\/|$)/);
  if (match && isLocale(match[1])) return match[1] as Locale;
  return null;
}

export function LocaleSwitcher({ className }: LocaleSwitcherProps) {
  const rawLocale = useLocale();
  const [urlLocale, setUrlLocale] = useState<Locale | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrlLocale(detectLocaleFromUrl());
  }, []);

  const contextLocale: Locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const currentLocale: Locale =
    contextLocale !== DEFAULT_LOCALE
      ? contextLocale
      : (urlLocale ?? contextLocale);

  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("common.localeSwitcher");

  function switchLocale(nextLocale: Locale) {
    if (nextLocale === currentLocale) {
      return;
    }

    const nextPathname = resolveLocaleSwitchPathname(pathname, nextLocale);

    startTransition(() => {
      router.replace(nextPathname, { locale: nextLocale });
    });

    void fetch("/api/v1/me/locale", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ locale: nextLocale }),
      credentials: "include",
    }).catch(() => {
      // Keep navigation non-blocking even if persistence fails.
    });
  }

  return (
    <div
      role="navigation"
      aria-label={t("ariaLabel")}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-[var(--color-hero-blue)]/15 bg-white/80 p-1 shadow-sm backdrop-blur-xl",
        className,
      )}
    >
      {SUPPORTED_LOCALES.map((locale) => {
        const isActive = locale === currentLocale;
        const config = LOCALE_CONFIG[locale];

        return (
          <button
            key={locale}
            type="button"
            lang={config.bcp47Tag}
            aria-current={isActive ? "true" : undefined}
            aria-label={locale === "en" ? t("english") : t("arabic")}
            onClick={() => switchLocale(locale)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
              isActive
                ? "bg-[var(--color-hero-blue)] text-white"
                : "text-[var(--color-hero-heading)] hover:bg-[var(--color-hero-blue)]/8",
            )}
          >
            {config.label}
          </button>
        );
      })}
    </div>
  );
}
