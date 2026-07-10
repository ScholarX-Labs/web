import { getTranslations } from "next-intl/server";
import { generateLocalizedMetadata } from "@/lib/i18n/metadata";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/i18n/locales";

export { default } from "../../../(platform)/courses/page";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const t = await getTranslations({ locale, namespace: "courses" });

  return generateLocalizedMetadata({
    locale: locale as Locale,
    title: t("meta.title"),
    description: t("meta.description"),
    pathname: "/courses",
  });
}
