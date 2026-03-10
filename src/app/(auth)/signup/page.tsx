"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Field from "@/app/(auth)/_components/Field";
import { Button } from "@/components/ui/button";
import { signIn, signUp } from "@/lib/auth-client";
import { redirect } from "next/navigation";

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

const passwordRequirements = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/;

const signupSchema = z
  .object({
    firstName: z.string().min(1, { message: "First name is required" }).max(50),
    lastName: z.string().min(1, { message: "Last name is required" }).max(50),
    email: z.email({ message: "Enter a valid email address" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" })
      .max(128, { message: "Password is too long" })
      .regex(passwordRequirements, {
        message:
          "Password must include uppercase, lowercase, number and special character",
      }),
    confirmPassword: z.string(),
    phoneNumber: z
      .string()
      .min(1, { message: "Phone number is required" })
      .refine((v) => isValidPhoneNumber(v), {
        message: "Invalid phone number",
      }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type SignupForm = z.infer<typeof signupSchema>;

export default function Page() {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      phoneNumber: "",
    },
  });

  const onSubmit = async (data: SignupForm) => {
    setServerError(null);
    const { confirmPassword, ...payload } = data;
    const uniqueQuery = new URLSearchParams({
      email: payload.email,
      phone: payload.phoneNumber,
    });
    const uniqueCheck = await fetch(`/api/check-uniques?${uniqueQuery}`);
    const uniqueCheckData = await uniqueCheck.json().catch(() => ({}));
    const uniqueErrors = uniqueCheckData.errors as
      | { email?: string; phone?: string }
      | undefined;

    if (uniqueCheck.status === 400) {
      if (uniqueErrors?.email) {
        setError("email", {
          type: "server",
          message: uniqueErrors.email,
        });
      }

      if (uniqueErrors?.phone) {
        setError("phoneNumber", {
          type: "server",
          message: uniqueErrors.phone,
        });
      }

      return;
    }
    const { error } = await signUp.email({
      email: payload.email,
      password: payload.password,
      name: `${payload.firstName} ${payload.lastName}`,
      firstName: payload.firstName,
      lastName: payload.lastName,
      phoneNumber: payload.phoneNumber,
    });

    if (error) {
      const msg = error.message ?? "";
      if (msg.toLowerCase().includes("phone") || error.status === 409) {
        setServerError("This phone number is already in use.");
      } else if (
        error.status === 422 ||
        msg.toLowerCase().includes("invalid")
      ) {
        setServerError("Invalid details provided. Please check your inputs.");
      } else {
        setServerError(msg || "Something went wrong. Please try again.");
      }
    }
    redirect("/");
  };

  return (
    <section
      about="signup-form"
      className="bg-[oklch(96%_0.02_228.96)] h-full w-full flex justify-center items-center p-4"
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="min-h-3/4 lg:w-3/8 w-1/2 p-6 rounded-2xl flex flex-col gap-4"
      >
        <h2 className="text-center text-3xl font-semibold">
          Create your account
        </h2>

        {serverError && (
          <p role="alert" className="text-destructive text-sm text-center">
            {serverError}
          </p>
        )}
        <div className="flex gap-2">
          <Field
            label="First Name"
            {...register("firstName")}
            error={errors.firstName?.message}
          />
          <Field
            label="Last Name"
            {...register("lastName")}
            error={errors.lastName?.message}
          />
        </div>
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
        <Field
          label="Confirm password"
          type="password"
          {...register("confirmPassword")}
          error={errors.confirmPassword?.message}
        />
        <Controller
          name="phoneNumber"
          control={control}
          render={({ field }) => (
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="phoneNumber"
                className="text-sm font-medium leading-none"
              >
                Phone number
              </label>
              <div className="flex h-9 w-full rounded-md border border-input bg-white px-3 shadow-sm focus-within:ring-1 focus-within:ring-ring">
                <PhoneInput
                  id="phoneNumber"
                  international
                  defaultCountry="EG"
                  placeholder="+20 123 456 7890"
                  value={field.value}
                  onChange={(val) => field.onChange(val ?? "")}
                  className="w-full text-sm"
                />
              </div>
              {errors.phoneNumber && (
                <p role="alert" className="text-destructive text-sm">
                  {errors.phoneNumber.message}
                </p>
              )}
            </div>
          )}
        />
        <Button
          type="submit"
          disabled={isSubmitting}
          className={
            "text-primary-foreground max-w-64 self-center w-1/2 " +
            (isSubmitting ? "cursor-not-allowed" : "cursor-pointer")
          }
        >
          {isSubmitting ? "Loading..." : "Sign up"}
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
          Already have an account?
          <Link
            href="/signin"
            className="relative text-primary motion-safe:transition-colors duration-200 ease-in-out hover:opacity-80 after:content-[''] after:absolute after:-bottom-0.5 after:left-0 after:h-0.5 after:w-full after:origin-bottom-right after:scale-x-0 after:bg-current after:transition-transform after:duration-300 after:ease-in-out hover:after:scale-x-100 hover:after:origin-bottom-left"
          >
            Sign in
          </Link>
        </p>
      </form>
    </section>
  );
}
