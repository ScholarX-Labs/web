export type AgentLogPayload = {
  sessionId: string;
  runId: string;
  hypothesisId: string;
  location: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: number;
};

const ENDPOINT = process.env.NEXT_PUBLIC_AGENT_LOG_INGEST_URL;
const SESSION_ID = process.env.NEXT_PUBLIC_AGENT_LOG_SESSION_ID ?? "local";

export function agentLog(payload: Omit<AgentLogPayload, "sessionId">) {
  if (typeof window === "undefined") return;
  if (!ENDPOINT) return;

  const body = JSON.stringify({ sessionId: SESSION_ID, ...payload });

  // Prefer fetch w/ session header when allowed; fall back to beacon to avoid CORS/preflight issues.
  try {
    fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": SESSION_ID,
      },
      body,
      keepalive: true,
    }).catch(() => {
      if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
        navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "text/plain" }));
      }
    });
  } catch {
    if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "text/plain" }));
    }
  }
}

