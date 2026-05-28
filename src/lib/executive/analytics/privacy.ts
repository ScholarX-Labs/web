import type { AnalyticsProperties } from "./types";

const FORBIDDEN_KEYS = [
  "token",
  "accessToken",
  "refreshToken",
  "secret",
  "password",
  "authorization",
] as const;

export function sanitizeAnalyticsProperties(
  input: AnalyticsProperties = {},
): AnalyticsProperties {
  const safe: AnalyticsProperties = {};
  for (const [key, value] of Object.entries(input)) {
    if (FORBIDDEN_KEYS.includes(key as (typeof FORBIDDEN_KEYS)[number])) {
      continue;
    }
    safe[key] = value;
  }
  return safe;
}

