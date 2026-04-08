"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Field from "@/app/auth/_components/Field";
import { Button } from "@/components/ui/button";
import { signIn } from "@/lib/auth-client";
import { GoogleIcon } from "../../../components/icons/GoogleIcon";
import { ROUTES } from "@/lib/routes";

const signinSchema = z.object({
  email: z.email({ message: "Enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

type SigninForm = z.infer<typeof signinSchema>;

export default function Page() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSocialSubmitting, setIsSocialSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SigninForm>({
    resolver: zodResolver(signinSchema as any),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const isAnySubmitting = isSubmitting || isSocialSubmitting;

  const onSubmit = async (data: SigninForm) => {
    if (isSocialSubmitting) return;
    setServerError(null);

    const { error } = await signIn.email({
      email: data.email,
      password: data.password,
      callbackURL: "/",
    });

    if (error) {
      setServerError(error.message ?? "Unable to sign in. Please try again.");
    }
  };

  const onGoogleSignIn = async () => {
    if (isAnySubmitting) return;

    setServerError(null);
    setIsSocialSubmitting(true);

    try {
      const result = await signIn.social({
        provider: "google",
        callbackURL: ROUTES.PHONE_COLLECTION,
      });

      if (result?.error) {
        setServerError(
          result.error.message ??
            "Unable to continue with Google. Please try again.",
        );
      }
    } finally {
      setIsSocialSubmitting(false);
    }
  };

  return (
    <section className="bg-auth-surface h-full w-full flex justify-center items-center p-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="min-h-[75vh] lg:w-[37.5%] w-1/2 p-6 rounded-2xl flex flex-col gap-4"
      >
        <h2 className="text-center text-3xl font-semibold">Sign in</h2>

        {serverError && (
          <p role="alert" className="text-destructive text-sm text-center">
            {serverError}
          </p>
        )}

        <Field
          label="Email"
          type="email"
          {...register("email")}
          error={errors.email?.message}
        />

        <Field
          label="Password"
          type="password"
          {...register("password")}
          error={errors.password?.message}
        />

        <Button
          type="submit"
          disabled={isAnySubmitting}
          className={
            "text-primary-foreground max-w-64 self-center w-1/2 " +
            (isAnySubmitting ? "cursor-not-allowed" : "cursor-pointer")
          }
        >
          {isAnySubmitting ? "Loading..." : "Sign in"}
        </Button>

        <div className="flex items-center gap-3">
          <span className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <span className="flex-1 h-px bg-border" />
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={isAnySubmitting}
          className="h-10 w-full max-w-64 self-center justify-center gap-3 rounded-md border-[#dadce0] bg-white px-3 text-sm font-medium text-[#3c4043] shadow-none transition-colors hover:border-[#d2e3fc] hover:bg-[#f8f9fa] hover:text-[#3c4043] hover:cursor-pointer focus-visible:border-[#4285f4] focus-visible:ring-[#4285f4]/30 active:bg-[#f1f3f4]"
          onClick={onGoogleSignIn}
        >
          <GoogleIcon />
          {isAnySubmitting ? "Loading..." : "Continue with Google"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href={ROUTES.SIGNUP}
            className="relative text-primary motion-safe:transition-colors duration-200 ease-in-out hover:opacity-80 after:content-[''] after:absolute after:-bottom-0.5 after:left-0 after:h-0.5 after:w-full after:origin-bottom-right after:scale-x-0 after:bg-current after:transition-transform after:duration-300 after:ease-in-out hover:after:scale-x-100 hover:after:origin-bottom-left"
          >
            Sign up
          </Link>
        </p>
      </form>
    </section>
  );
}
