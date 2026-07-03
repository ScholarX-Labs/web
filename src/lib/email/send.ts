import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema/auth-schema";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/i18n/locales";

interface ResolveEmailLocaleOptions {
  userId?: string;
  email?: string;
  journeyLocale?: string;
}

export async function resolveEmailLocale({
  userId,
  email,
  journeyLocale,
}: ResolveEmailLocaleOptions): Promise<Locale> {
  if (userId) {
    const [result] = await db
      .select({ locale: user.locale })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (isLocale(result?.locale)) {
      return result.locale;
    }
  }

  if (email) {
    const [result] = await db
      .select({ locale: user.locale })
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (isLocale(result?.locale)) {
      return result.locale;
    }
  }

  if (isLocale(journeyLocale)) {
    return journeyLocale;
  }

  return DEFAULT_LOCALE;
}
