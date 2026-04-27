"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Field from "@/app/auth/_components/Field";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

const forgotPasswordSchema = z.object({
  email: z.email({ message: "Enter a valid email address" }),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordForm() {
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

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
    setServerError(null);

    const { error } = await authClient.requestPasswordReset({
      email: data.email,
      redirectTo: "/auth/reset-password",
    });

    if (error) {
      setServerError(error.message ?? "An error occurred. Please try again.");
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <h2 className="text-2xl font-semibold text-primary">
          Check your email
        </h2>
        <p className="text-muted-foreground">
          We&apos;ve sent a password reset link to your email address. It will
          expire in 10 minutes.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <h2 className="text-center text-3xl font-semibold mb-2">
        Reset Password
      </h2>
      <p className="text-center text-sm text-muted-foreground mb-4">
        Enter your email address and we&apos;ll send you a link to reset your
        password.
      </p>

      {serverError && (
        <p role="alert" className="text-destructive text-sm text-center">
          {serverError}
        </p>
      )}

      <Field
        label="Email"
        type="email"
        placeholder="you@example.com"
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
        {isSubmitting ? "Sending..." : "Send Reset Link"}
      </Button>
    </form>
  );
}
