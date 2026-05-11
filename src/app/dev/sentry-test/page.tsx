"use client";

import * as Sentry from "@sentry/nextjs";
import { notFound } from "next/navigation";
import { useEffect, useState } from "react";

const isDev = process.env.NODE_ENV === "development";

export default function SentryTestPage() {
  const [serverResult, setServerResult] = useState<string>("");
  const [logs, setLogs] = useState<string[]>([]);

  if (!isDev) {
    notFound();
  }

  const addLog = (msg: string) => setLogs((p) => [...p, `${new Date().toLocaleTimeString()} — ${msg}`]);

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-8">
      <h1 className="text-2xl font-bold">Sentry Integration Test</h1>
      <p className="text-muted-foreground text-sm">Dev-only page to verify Sentry is working end-to-end.</p>

      <section className="grid gap-3">
        <button
          className="rounded border bg-red-500 px-4 py-2 text-white hover:bg-red-600"
          onClick={() => {
            addLog("Throwing client error...");
            throw new Error("[Sentry Test] Client-side unhandled error");
          }}
        >
          Throw Unhandled Client Error
        </button>

        <button
          className="rounded border bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
          onClick={() => {
            Sentry.captureException(new Error("[Sentry Test] Manual captureException"));
            addLog("captureException sent");
          }}
        >
          Sentry.captureException
        </button>

        <button
          className="rounded border bg-yellow-500 px-4 py-2 text-white hover:bg-yellow-600"
          onClick={() => {
            Sentry.captureMessage("[Sentry Test] captureMessage — info", "info");
            addLog("captureMessage sent");
          }}
        >
          Sentry.captureMessage
        </button>

        <button
          className="rounded border bg-purple-500 px-4 py-2 text-white hover:bg-purple-600"
          onClick={async () => {
            addLog("Calling server error route...");
            setServerResult("loading...");
            try {
              const res = await fetch("/api/sentry-test");
              setServerResult(await res.text());
              addLog("Server route responded");
            } catch {
              setServerResult("Fetch failed");
              addLog("Server route fetch failed");
            }
          }}
        >
          Trigger Server Error (API Route)
        </button>
      </section>

      {serverResult && (
        <pre className="rounded bg-muted p-3 text-xs">{serverResult}</pre>
      )}

      <section>
        <h2 className="mb-2 font-semibold">Event Log</h2>
        <div className="flex flex-col gap-1">
          {logs.map((l, i) => (
            <code key={i} className="rounded bg-muted px-2 py-1 text-xs">{l}</code>
          ))}
          {logs.length === 0 && (
            <span className="text-muted-foreground text-xs">No events yet. Click a button above.</span>
          )}
        </div>
      </section>
    </main>
  );
}
