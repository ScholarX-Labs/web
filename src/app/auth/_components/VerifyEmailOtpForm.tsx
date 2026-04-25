"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { emailOtp } from "@/lib/auth-client";

type VerifyEmailOtpFormProps = {
  email: string;
};

function getFriendlyError(message?: string): string {
  if (!message) {
    return "Something went wrong. Please try again.";
  }

  if (message.includes("ERR_EMAIL_OTP_RATE_LIMIT_HOURLY")) {
    return "You have reached the hourly limit. You can request up to 4 codes per hour.";
  }

  if (message.includes("ERR_EMAIL_OTP_RATE_LIMIT_DAILY")) {
    return "You have reached the daily limit. You can request up to 10 codes per day.";
  }

  if (message.includes("OTP_EXPIRED")) {
    return "This code has expired. Request a new code and try again.";
  }

  if (message.includes("INVALID_OTP")) {
    return "The code is invalid. Please check it and try again.";
  }

  if (message.includes("TOO_MANY_ATTEMPTS")) {
    return "Too many incorrect attempts. Request a new code and try again.";
  }

  return message;
}

export default function VerifyEmailOtpForm({ email }: VerifyEmailOtpFormProps) {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const otpIsValid = useMemo(() => /^\d{6}$/.test(otp), [otp]);

  const handleOtpChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "").slice(0, 6);
    setOtp(digitsOnly);
  };

  const handleVerify = async () => {
    if (!otpIsValid || isVerifying) {
      return;
    }

    setIsVerifying(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const { error } = await emailOtp.verifyEmail({
        email,
        otp,
      });

      if (error) {
        setErrorMessage(getFriendlyError(error.message));
        return;
      }

      setSuccessMessage("Email verified successfully.");
      router.refresh();
    } catch {
      setErrorMessage("Email verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (isResending) {
      return;
    }

    setIsResending(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const { error } = await emailOtp.sendVerificationOtp({
        email,
        type: "email-verification",
      });

      if (error) {
        setErrorMessage(getFriendlyError(error.message));
        return;
      }

      setSuccessMessage("A verification code was sent to your inbox.");
    } catch {
      setErrorMessage("Failed to send a new code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Input
        id="email-otp"
        value={otp}
        onChange={(event) => handleOtpChange(event.target.value)}
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={6}
        placeholder="Enter 6-digit code"
        aria-label="6 digit verification code"
        disabled={isVerifying || isResending}
      />
      <Button
        type="button"
        onClick={handleVerify}
        disabled={!otpIsValid || isVerifying || isResending}
        className="w-full hover:cursor-pointer"
      >
        {isVerifying ? "Verifying..." : "Verify Email"}
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={handleResend}
        disabled={isResending || isVerifying}
        className="w-full hover:cursor-pointer"
      >
        {isResending ? "Sending code..." : "Resend Verification Code"}
      </Button>
      {successMessage ? (
        <p className="text-sm text-center text-emerald-700">{successMessage}</p>
      ) : null}
      {errorMessage ? (
        <p role="alert" className="text-sm text-center text-destructive">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
