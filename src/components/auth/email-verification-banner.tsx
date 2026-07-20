"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";

const DISMISSED_PREFIX = "email-verification-banner-dismissed:";

export function EmailVerificationBanner() {
  const { data: session } = useSession();
  const router = useRouter();

  const userId = (session?.user as Record<string, unknown> | undefined)?.id as string | undefined;
  const dismissedKey = userId ? `${DISMISSED_PREFIX}${userId}` : undefined;

  const [dismissed, setDismissed] = useState(false);
  const [syncedKey, setSyncedKey] = useState<string | undefined>(undefined);

  if (dismissedKey && dismissedKey !== syncedKey) {
    setSyncedKey(dismissedKey);
    if (typeof window !== "undefined" && localStorage.getItem(dismissedKey) === "true") {
      setDismissed(true);
    }
  }

  if (!session?.user) return null;

  const user = session.user as Record<string, unknown>;
  if (user.emailVerified || !user.emailVerificationSkipped) return null;
  if (dismissed) return null;

  return (
    <Alert className="rounded-none border-x-0 border-t-0 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100">
      <AlertTriangle className="size-4" />
      <AlertDescription className="flex flex-1 items-center justify-between gap-2">
        <span>
          Please verify your email to access all features.
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-amber-900 underline dark:text-amber-100"
            onClick={() => router.push(ROUTES.VERIFY_EMAIL)}
          >
            Verify now
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-amber-900 hover:text-amber-700 dark:text-amber-100 dark:hover:text-amber-300"
            aria-label="Dismiss"
            onClick={() => {
              if (dismissedKey) {
                localStorage.setItem(dismissedKey, "true");
              }
              setDismissed(true);
            }}
          >
            <X className="size-3" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
