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
    <html>
      <body>
        <h2>Something went wrong!</h2>
        {unstable_retry && (
          <button onClick={unstable_retry}>Try again</button>
        )}
      </body>
    </html>
  );
}
