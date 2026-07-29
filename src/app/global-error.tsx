"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry?: () => void;
}) {
  useEffect(() => {
    if (error) {
      Sentry.captureException(error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error?.message, error?.digest]);

  return (
    <html lang="en">
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <main className="mx-auto flex min-h-dvh w-full max-w-2xl items-center px-6 py-12">
          <section
            className="w-full rounded-2xl border bg-card p-8 text-center shadow-sm"
            role="alert"
            aria-labelledby="global-error-title"
          >
            <h1 id="global-error-title" className="text-2xl font-bold">
              Something went wrong
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Please try again. If the problem continues, return to the home page
              and try again later.
            </p>
            {unstable_retry && (
              <button
                className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                onClick={unstable_retry}
              >
                Try again
              </button>
            )}
          </section>
        </main>
      </body>
    </html>
  );
}
