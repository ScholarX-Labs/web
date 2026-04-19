export type AgentLogPayload = {
  sessionId: string;
  runId: string;
  hypothesisId: string;
  location: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: number;
};

const ENDPOINT =
  "http://127.0.0.1:7355/ingest/609c9440-ed6c-4452-8fa9-e3e15a5d069b";
const SESSION_ID = "637bd4";

export function agentLog(payload: Omit<AgentLogPayload, "sessionId">) {
  if (typeof window === "undefined") return;

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

