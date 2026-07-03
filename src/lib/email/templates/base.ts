import type { Locale } from "@/lib/i18n/locales";
import { LOCALE_CONFIG } from "@/lib/i18n/locales";

export function interpolate(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
}

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function buildEmailHtml(params: {
  locale: Locale;
  heading: string;
  body: string;
  ctaUrl?: string;
  ctaLabel?: string;
}) {
  const { locale, heading, body, ctaUrl, ctaLabel } = params;
  const localeConfig = LOCALE_CONFIG[locale];
  const textAlign = localeConfig.dir === "rtl" ? "right" : "left";
  const safeUrl = ctaUrl ? escapeHtml(ctaUrl) : null;
  const safeLabel = ctaLabel ? escapeHtml(ctaLabel) : null;

  return `<!DOCTYPE html>
<html lang="${localeConfig.bcp47Tag}" dir="${localeConfig.dir}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body style="margin:0;padding:24px;background:#f8fafc;font-family:Arial,sans-serif;direction:${localeConfig.dir};text-align:${textAlign};color:#0f172a;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;">
      <h1 style="margin:0 0 16px;font-size:24px;line-height:1.4;">${escapeHtml(heading)}</h1>
      <p style="margin:0 0 20px;font-size:16px;line-height:1.7;">${escapeHtml(body)}</p>
      ${safeUrl && safeLabel ? `<a href="${safeUrl}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#3399cc;color:#ffffff;text-decoration:none;font-weight:700;">${safeLabel}</a>` : ""}
    </div>
  </body>
</html>`;
}
