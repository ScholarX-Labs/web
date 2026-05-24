import { isIP } from "node:net";

type HeaderSource = Pick<Headers, "get">;

function normalizeHeaderIp(value: string | null): string | null {
  if (!value) return null;

  const first = value.split(",")[0]?.trim();
  if (!first) return null;

  const bracketed = first.match(/^\[([^\]]+)\](?::\d+)?$/);
  if (bracketed) {
    return isIP(bracketed[1]) ? bracketed[1] : null;
  }

  if (isIP(first)) return first;

  const withPort = first.match(/^(.+):(\d+)$/);
  if (withPort && isIP(withPort[1])) {
    return withPort[1];
  }

  return null;
}

export function getClientIpFromHeaders(headers: HeaderSource): string | null {
  return (
    normalizeHeaderIp(headers.get("x-forwarded-for")) ??
    normalizeHeaderIp(headers.get("x-real-ip"))
  );
}
