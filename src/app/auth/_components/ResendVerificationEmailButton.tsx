"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { emailOtp } from "@/lib/auth-client";

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
      const { error } = await emailOtp.sendVerificationOtp({
        email,
        type: "email-verification",
      });

      if (error) {
        if (error.message?.includes("ERR_EMAIL_OTP_RATE_LIMIT_HOURLY")) {
          setErrorMessage("You can request up to 4 codes per hour.");
          return;
        }

        if (error.message?.includes("ERR_EMAIL_OTP_RATE_LIMIT_DAILY")) {
          setErrorMessage("You can request up to 10 codes per day.");
          return;
        }

        setErrorMessage(error.message ?? "Failed to resend verification code.");
        return;
      }

      setMessage("Verification code sent. Please check your inbox.");
      router.refresh();
    } catch {
      setErrorMessage("Failed to resend verification code. Try again.");
    } finally {
      setIsSubmitting(false);
    }
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
            ? "Resend Verification Code"
            : "Send Verification Code"}
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
