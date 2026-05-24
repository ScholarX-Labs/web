type HeaderSource = Pick<Headers, "get">;

function normalizeHeaderIp(value: string | null): string | null {
  if (!value) return null;

  const first = value.split(",")[0]?.trim();
  return first ? first : null;
}

export function getClientIpFromHeaders(headers: HeaderSource): string {
  return (
    normalizeHeaderIp(headers.get("x-forwarded-for")) ??
    normalizeHeaderIp(headers.get("x-real-ip")) ??
    "unknown"
  );
}
