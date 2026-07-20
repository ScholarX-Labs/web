"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useSession } from "@/lib/auth-client";

export default function SkipEmailVerificationButton() {
  const router = useRouter();
  const { refetch } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSkip = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/skip-email-verification", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "Failed to skip verification.");
        return;
      }
      await refetch();
      router.replace("/");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Button
        type="button"
        variant="ghost"
        onClick={handleSkip}
        disabled={loading}
        className="w-full text-muted-foreground hover:text-foreground"
      >
        {loading ? "Continuing..." : "Continue without verifying"}
      </Button>
    </>
  );
}
