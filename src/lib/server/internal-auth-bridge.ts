import "server-only";

import { createHmac, randomUUID } from "crypto";

const INTERNAL_AUTH_VERSION = "v1";
const DEFAULT_TOKEN_TTL_SECONDS = 60;

const getBridgeSecret = (): string => {
  const secret = process.env.INTERNAL_AUTH_BRIDGE_SECRET?.trim();
  if (!secret) {
    throw new Error(
      "INTERNAL_AUTH_BRIDGE_SECRET is required for backend identity bridge.",
    );
  }
  return secret;
};

const createSignature = (
  payload: string,
  secret: string,
): string => createHmac("sha256", secret).update(payload).digest("hex");

export interface InternalAuthIdentity {
  userId: string;
  sessionId?: string;
}

export const createInternalAuthHeaders = (
  identity: InternalAuthIdentity,
  nowSeconds = Math.floor(Date.now() / 1000),
): HeadersInit => {
  const secret = getBridgeSecret();
  const issuedAt = nowSeconds;
  const expiresAt = nowSeconds + DEFAULT_TOKEN_TTL_SECONDS;
  const sessionId = identity.sessionId && identity.sessionId.trim().length > 0
    ? identity.sessionId
    : randomUUID();

  const payload = `${identity.userId}.${sessionId}.${issuedAt}.${expiresAt}`;
  const signature = createSignature(payload, secret);

  return {
    "x-internal-auth-version": INTERNAL_AUTH_VERSION,
    "x-internal-user-id": identity.userId,
    "x-internal-session-id": sessionId,
    "x-internal-issued-at": String(issuedAt),
    "x-internal-expires-at": String(expiresAt),
    "x-internal-signature": signature,
  };
};
