import { getTranslations } from "next-intl/server";
import HomePage from "../page";
import {
  generateLocalizedMetadata,
} from "@/lib/i18n/metadata";
import { type Locale, isLocale, DEFAULT_LOCALE } from "@/lib/i18n/locales";

export const revalidate = 86400;
export const dynamic = "force-static";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const t = await getTranslations({ locale, namespace: "home" });

  return generateLocalizedMetadata({
    locale: locale as Locale,
    title: t("meta.title"),
    description: t("meta.description"),
    pathname: "/",
  });
}

export default HomePage;
