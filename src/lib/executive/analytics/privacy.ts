import type { AnalyticsProperties } from "./types";

const FORBIDDEN_KEYS = [
  "token",
  "accessToken",
  "refreshToken",
  "secret",
  "password",
  "authorization",
] as const;

const FORBIDDEN_KEYS_NORMALIZED = new Set(
  FORBIDDEN_KEYS.map((key) => key.toLowerCase()),
);

export function sanitizeAnalyticsProperties(
  input: AnalyticsProperties = {},
): AnalyticsProperties {
  const safe: AnalyticsProperties = {};
  for (const [key, value] of Object.entries(input)) {
    const normalizedKey = key.toLowerCase();
    if (FORBIDDEN_KEYS_NORMALIZED.has(normalizedKey)) {
      continue;
    }
    safe[key] = value;
  }
  return safe;
}
