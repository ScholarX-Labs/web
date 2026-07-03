"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Field from "@/app/auth/_components/Field";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useTranslations } from "next-intl";

type ForgotPasswordFormData = {
  email: string;
};

export default function ForgotPasswordForm() {
  const t = useTranslations("auth.forgotPassword");
  const [success, setSuccess] = useState(false);

  const forgotPasswordSchema = useMemo(() => z.object({
    email: z.email({ message: t("errors.emailInvalid") }),
  }), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    const { error } = await authClient.requestPasswordReset({
      email: data.email,
      redirectTo: "/auth/reset-password",
    });

    if (error) {
      console.error("Password reset request failed", error);
    }

    setSuccess(true);
  };

  if (success) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <h2 className="text-2xl font-semibold text-primary">
          {t("successTitle")}
        </h2>
        <p className="text-muted-foreground">
          {t("successDescription")}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <h2 className="text-center text-3xl font-semibold mb-2">
        {t("title")}
      </h2>
      <p className="text-center text-sm text-muted-foreground mb-4">
        {t("description")}
      </p>

      <Field
        label={t("emailLabel")}
        type="email"
        placeholder={t("emailPlaceholder")}
        {...register("email")}
        error={errors.email?.message}
      />

      <Button
        type="submit"
        disabled={isSubmitting}
        className={
          "w-full text-primary-foreground " +
          (isSubmitting ? "cursor-not-allowed opacity-50" : "cursor-pointer")
        }
      >
        {isSubmitting ? t("sending") : t("submitButton")}
      </Button>
    </form>
  );
}
