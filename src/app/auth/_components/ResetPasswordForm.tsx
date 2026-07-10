"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";

type ResetPasswordFormValues = {
  password: string;
  confirmPassword: string;
};

export default function ResetPasswordForm() {
  const t = useTranslations("auth.resetPassword");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlError =
    searchParams.get("error") === "INVALID_TOKEN"
      ? t("invalidToken")
      : null;

  const resetPasswordSchema = useMemo(() => {
    return z
      .object({
        password: z
          .string()
          .min(8, { message: t("errors.passwordLength") })
          .max(128, { message: t("errors.passwordTooLong") })
          .regex(/[A-Z]/, {
            message: t("errors.passwordUpper"),
          })
          .regex(/[a-z]/, {
            message: t("errors.passwordLower"),
          })
          .regex(/[0-9]/, { message: t("errors.passwordNumber") }),
        confirmPassword: z.string(),
      })
      .superRefine((values, ctx) => {
        if (values.password !== values.confirmPassword) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["confirmPassword"],
            message: t("errors.passwordsDoNotMatch"),
          });
        }
      });
  }, [t]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    const token = searchParams.get("token");

    if (!token) {
      setServerError(t("missingToken"));
      return;
    }

    setServerError(null);

    const { error } = await authClient.resetPassword({
      newPassword: data.password,
      token,
    });

    if (error) {
      setServerError(
        error.message ?? t("errors.fallback")
      );
    } else {
      router.push("/auth/signin?reset=success");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        {(serverError || urlError) && (
          <p
            role="alert"
            className="text-destructive text-sm text-center font-medium bg-destructive/10 p-2 rounded-md"
          >
            {serverError || urlError}
          </p>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="sr-only">
              {t("passwordPlaceholder")}
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={t("passwordPlaceholder")}
                className="pr-10 h-12 text-sm rounded-lg"
                {...register("password")}
                aria-invalid={!!errors.password}
                aria-describedby={
                  errors.password ? "password-error" : undefined
                }
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p id="password-error" className="text-destructive text-xs">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="sr-only">
              {t("confirmPasswordPlaceholder")}
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder={t("confirmPasswordPlaceholder")}
                className="pr-10 h-12 text-sm rounded-lg"
                {...register("confirmPassword")}
                aria-invalid={!!errors.confirmPassword}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm cursor-pointer"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-destructive text-xs">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 text-base font-medium bg-[#3b99d9] hover:bg-[#3b99d9]/90 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
        >
          {isSubmitting ? t("resetting") : t("submitButton")}
        </Button>
      </form>
    </div>
  );
}
