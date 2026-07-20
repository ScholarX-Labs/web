"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";

export default function SkipEmailVerificationButton() {
  const router = useRouter();
  const { refetch } = useSession();
  const [loading, setLoading] = useState(false);

  const handleSkip = async () => {
    setLoading(true);
    try {
      await fetch("/api/skip-email-verification", { method: "POST" });
      await refetch();
      router.replace("/");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={handleSkip}
      disabled={loading}
      className="w-full text-muted-foreground hover:text-foreground"
    >
      {loading ? "Continuing..." : "Continue without verifying"}
    </Button>
  );
}
