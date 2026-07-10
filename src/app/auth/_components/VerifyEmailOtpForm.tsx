"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { emailOtp } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

type VerifyEmailOtpFormProps = {
  email: string;
};

type AuthError = {
  message?: string;
  code?: string;
};

function getFriendlyError(t: (key: string) => string, error?: AuthError): string {
  if (!error) {
    return t("errors.fallback");
  }

  const { message, code } = error;

  if (
    code === "ERR_EMAIL_OTP_RATE_LIMIT_HOURLY" ||
    message?.includes("ERR_EMAIL_OTP_RATE_LIMIT_HOURLY")
  ) {
    return t("errors.rateLimitHourly");
  }

  if (
    code === "ERR_EMAIL_OTP_RATE_LIMIT_DAILY" ||
    message?.includes("ERR_EMAIL_OTP_RATE_LIMIT_DAILY")
  ) {
    return t("errors.rateLimitDaily");
  }

  if (code === "OTP_EXPIRED" || message?.includes("OTP_EXPIRED")) {
    return t("errors.otpExpired");
  }

  if (code === "INVALID_OTP" || message?.includes("INVALID_OTP")) {
    return t("errors.otpInvalid");
  }

  if (code === "TOO_MANY_ATTEMPTS" || message?.includes("TOO_MANY_ATTEMPTS")) {
    return t("errors.tooManyAttempts");
  }

  return message || t("errors.fallback");
}

export default function VerifyEmailOtpForm({ email }: VerifyEmailOtpFormProps) {
  const t = useTranslations("auth.verifyEmail");
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const otpString = useMemo(() => otp.join(""), [otp]);
  const otpIsValid = useMemo(() => /^\d{6}$/.test(otpString), [otpString]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    if (!digit && value !== "") return;

    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    const newOtp = [...otp];
    pastedData.split("").forEach((char, i) => {
      newOtp[i] = char;
    });
    setOtp(newOtp);
    const lastIndex = Math.min(pastedData.length, 5);
    inputRefs.current[lastIndex]?.focus();
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
        otp: otpString,
      });

      if (error) {
        setErrorMessage(getFriendlyError(t, error));
        return;
      }

      setSuccessMessage(t("successMessage"));
      router.refresh();
    } catch {
      setErrorMessage(t("errors.fallback"));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (isResending || countdown > 0) {
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
        setErrorMessage(getFriendlyError(t, error));
        return;
      }

      setSuccessMessage(t("sentMessage"));
      setCountdown(60);
    } catch {
      setErrorMessage(t("errors.fallback"));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-md mx-auto py-4">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="text-muted-foreground text-sm">
          {t("description")}
        </p>
      </div>

      <div
        className="flex gap-2 sm:gap-4 justify-center w-full"
        onPaste={handlePaste}
      >
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleOtpChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className={cn(
              "w-12 h-14 sm:w-16 sm:h-20 text-2xl sm:text-3xl font-bold text-center",
              "border-2 rounded-2xl bg-background transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-offset-2",
              digit
                ? "border-hero-blue text-hero-blue shadow-[0_4px_12px_rgba(51,153,204,0.1)]"
                : "border-gray-200 text-foreground",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
            disabled={isVerifying || isResending}
          />
        ))}
      </div>

      <div className="text-center space-y-6 w-full">
        {countdown > 0 ? (
          <p className="text-sm text-gray-500">
            {t("countdownText", { seconds: countdown })}
          </p>
        ) : (
          <div className="h-5" />
        )}

        <div className="flex flex-col gap-3 w-full">
          <Button
            type="button"
            onClick={handleVerify}
            disabled={!otpIsValid || isVerifying || isResending}
            className="w-full h-12 text-lg font-semibold bg-hero-blue hover:bg-[#2d88b6] transition-colors rounded-xl text-white border-none shadow-md hover:cursor-pointer"
          >
            {isVerifying ? t("verifying") : t("verifyButton")}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleResend}
            disabled={isResending || countdown > 0}
            className="w-full h-12 text-lg font-semibold border-hero-blue text-hero-blue hover:bg-hero-blue/5 transition-colors rounded-xl hover:cursor-pointer"
          >
            {isResending ? t("resending") : t("resendButton")}
          </Button>
        </div>

        {errorMessage && (
          <p
            role="alert"
            className="text-sm font-medium text-destructive animate-in fade-in slide-in-from-top-1"
          >
            {errorMessage}
          </p>
        )}
        {successMessage && !errorMessage && (
          <p className="text-sm font-medium text-emerald-600 animate-in fade-in slide-in-from-top-1">
            {successMessage}
          </p>
        )}
      </div>
    </div>
  );
}
