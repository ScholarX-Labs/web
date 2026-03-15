"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { sendVerificationEmail } from "@/lib/auth-client";
import { ROUTES } from "@/lib/routes";

type ResendVerificationEmailButtonProps = {
  email: string;
};

export default function ResendVerificationEmailButton({
  email,
}: ResendVerificationEmailButtonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleResend = async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    setErrorMessage(null);

    try {
      const { error } = await sendVerificationEmail({
        email,
        callbackURL: ROUTES.HOME,
      });

      if (error) {
        setErrorMessage(
          error.message ?? "Failed to resend verification email. Try again.",
        );
        return;
      }

      setMessage("Verification email sent. Please check your inbox.");
      router.refresh();
    } catch {
      setErrorMessage("Failed to resend verification email. Try again.");
    } finally {
      setIsSubmitting(false);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        onClick={handleResend}
        disabled={isSubmitting}
        className="w-full hover:cursor-pointer"
      >
        {isSubmitting
          ? "Sending..."
          : message
            ? "Resend Verification Email"
            : "Send Verification Email"}
      </Button>
      {message ? (
        <p className="text-sm text-center text-emerald-700">{message}</p>
      ) : null}
      {errorMessage ? (
        <p role="alert" className="text-sm text-center text-destructive">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
