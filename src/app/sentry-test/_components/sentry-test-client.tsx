"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SentryTestClient() {
  const [shouldCrash, setShouldCrash] = useState(false);

  if (shouldCrash) {
    throw new Error("Sentry test client error");
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 items-center px-4 py-16 sm:px-6 lg:px-8">
      <Card className="w-full border-slate-200/80 bg-white shadow-sm">
        <CardHeader className="space-y-3 border-b border-slate-100">
          <p className="text-sm font-medium tracking-[0.2em] text-slate-500 uppercase">
            Diagnostics
          </p>
          <CardTitle className="text-3xl text-slate-900">
            Sentry test route
          </CardTitle>
        </CardHeader>

        <CardContent className="grid gap-6 pt-6 text-slate-700">
          <p className="leading-relaxed">
            Use this route to confirm Sentry is capturing both server and client
            errors.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="button" onClick={() => setShouldCrash(true)}>
              Trigger client error
            </Button>

            <Button asChild variant="outline" type="button">
              <Link href="/sentry-test?server=1">Trigger server error</Link>
            </Button>
          </div>

          <p className="text-sm text-slate-500">
            The client button throws during render. The server link throws from
            the page component before it renders.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
