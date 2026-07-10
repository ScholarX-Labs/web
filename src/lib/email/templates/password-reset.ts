import type { Locale } from "@/lib/i18n/locales";
import { buildEmailHtml, interpolate } from "./base";
import en from "@/messages/en/email.json";
import ar from "@/messages/ar/email.json";

const EMAIL_MESSAGES = { en, ar } as const;

export function passwordResetCodeEmail(
  locale: Locale,
  otp: string,
  expiryMinutes: number,
) {
  const m = EMAIL_MESSAGES[locale].passwordResetCode;
  const subject = m.subject;
  const text = interpolate(m.body, { otp, expiryMinutes: String(expiryMinutes) });

  return {
    subject,
    text,
    html: buildEmailHtml({ locale, heading: subject, body: text }),
  };
}

export function passwordResetEmail(locale: Locale, resetUrl: string) {
  const m = EMAIL_MESSAGES[locale].passwordReset;
  const subject = m.subject;
  const text = interpolate(m.textBody, { resetUrl });

  return {
    subject,
    text,
    html: buildEmailHtml({
      locale,
      heading: subject,
      body: m.body,
      ctaUrl: resetUrl,
      ctaLabel: m.ctaLabel,
    }),
  };
}
