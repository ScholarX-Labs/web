"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Field from "@/app/(auth)/_components/Field";
import { Button } from "@/components/ui/button";
import { signIn } from "@/lib/auth-client";

function GoogleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-5"
    >
      <path
        d="M23.52 12.272c0-.817-.073-1.603-.209-2.357H12v4.458h6.472a5.533 5.533 0 0 1-2.4 3.629v3.01h3.884c2.273-2.093 3.564-5.178 3.564-8.74Z"
        fill="#4285F4"
      />
      <path
        d="M12 24c3.24 0 5.956-1.073 7.94-2.915l-3.884-3.01c-1.073.72-2.444 1.145-4.056 1.145-3.115 0-5.754-2.104-6.697-4.931H1.288v3.104A11.998 11.998 0 0 0 12 24Z"
        fill="#34A853"
      />
      <path
        d="M5.303 14.289A7.205 7.205 0 0 1 4.928 12c0-.795.137-1.568.375-2.289V6.607H1.288A11.998 11.998 0 0 0 0 12c0 1.939.464 3.776 1.288 5.393l4.015-3.104Z"
        fill="#FBBC04"
      />
      <path
        d="M12 4.78c1.764 0 3.345.607 4.591 1.8l3.444-3.444C17.95 1.198 15.235 0 12 0 7.288 0 3.185 2.702 1.288 6.607l4.015 3.104C6.246 6.884 8.885 4.78 12 4.78Z"
        fill="#EA4335"
      />
    </svg>
  );
}

const signinSchema = z.object({
  email: z.email({ message: "Enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

type SigninForm = z.infer<typeof signinSchema>;

export default function Page() {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SigninForm>({
    resolver: zodResolver(signinSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SigninForm) => {
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

  return (
    <section className="bg-[oklch(96%_0.02_228.96)] h-full w-full flex justify-center items-center p-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="min-h-3/4 lg:w-3/8 w-1/2 p-6 rounded-2xl flex flex-col gap-4"
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
          disabled={isSubmitting}
          className={
            "text-primary-foreground max-w-64 self-center w-1/2 " +
            (isSubmitting ? "cursor-not-allowed" : "cursor-pointer")
          }
        >
          {isSubmitting ? "Loading..." : "Sign in"}
        </Button>

        <div className="flex items-center gap-3">
          <span className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <span className="flex-1 h-px bg-border" />
        </div>

        <Button
          type="button"
          variant="outline"
          className="h-10 w-full max-w-64 self-center justify-center gap-3 rounded-md border-[#dadce0] bg-white px-3 text-sm font-medium text-[#3c4043] shadow-none transition-colors hover:border-[#d2e3fc] hover:bg-[#f8f9fa] hover:text-[#3c4043] hover:cursor-pointer focus-visible:border-[#4285f4] focus-visible:ring-[#4285f4]/30 active:bg-[#f1f3f4]"
          onClick={() =>
            signIn.social({ provider: "google", callbackURL: "/collect-phone" })
          }
        >
          <GoogleIcon />
          Continue with Google
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="relative text-primary motion-safe:transition-colors duration-200 ease-in-out hover:opacity-80 after:content-[''] after:absolute after:-bottom-0.5 after:left-0 after:h-0.5 after:w-full after:origin-bottom-right after:scale-x-0 after:bg-current after:transition-transform after:duration-300 after:ease-in-out hover:after:scale-x-100 hover:after:origin-bottom-left"
          >
            Sign up
          </Link>
        </p>
      </form>
    </section>
  );
}
