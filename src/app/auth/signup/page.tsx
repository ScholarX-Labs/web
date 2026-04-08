"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Field from "@/app/auth/_components/Field";
import { Button } from "@/components/ui/button";
import { signIn, signUp } from "@/lib/auth-client";
import { GoogleIcon } from "../../../components/icons/GoogleIcon";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/routes";

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
  const [isSocialSubmitting, setIsSocialSubmitting] = useState(false);
  const router = useRouter();

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

  const isAnySubmitting = isSubmitting || isSocialSubmitting;

  const onSubmit = async (data: SignupForm) => {
    if (isSocialSubmitting) return;
    setServerError(null);
    const { confirmPassword, ...payload } = data;

    const { error } = await signUp.email({
      email: payload.email,
      password: payload.password,
      name: `${payload.firstName} ${payload.lastName}`,
      firstName: payload.firstName,
      lastName: payload.lastName,
      phoneNumber: payload.phoneNumber,
      callbackURL: "/",
    });

    if (error) {
      const message = error.message ?? "";
      const hasEmailExistsError = message.includes("ERR_EMAIL_EXISTS");
      const hasPhoneExistsError = message.includes("ERR_PHONE_EXISTS");

      if (hasEmailExistsError) {
        setError("email", {
          type: "server",
          message: "Email already exists",
        });
      }

      if (hasPhoneExistsError) {
        setError("phoneNumber", {
          type: "server",
          message: "Phone number already exists",
        });
      }

      if (hasEmailExistsError || hasPhoneExistsError) {
        return;
      }

      if (error.status === 422 || message.toLowerCase().includes("invalid")) {
        setServerError("Invalid details provided. Please check your inputs.");
        return;
      }

      setServerError(
        error.message || "Something went wrong. Please try again.",
      );
      return;
    }

    router.replace("/");
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
    <section
      aria-label="signup-form"
      className="bg-auth-surface h-full w-full flex justify-center items-center p-4"
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="min-h-[75%] lg:w-[37.5%] w-1/2 p-6 rounded-2xl flex flex-col gap-4"
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
          disabled={isAnySubmitting}
          className={
            "text-primary-foreground max-w-64 self-center w-1/2 " +
            (isAnySubmitting ? "cursor-not-allowed" : "cursor-pointer")
          }
        >
          {isAnySubmitting ? "Loading..." : "Sign up"}
        </Button>

        <div className="relative flex items-center gap-3 text-xs text-muted-foreground before:content-[''] before:flex-1 before:h-px before:bg-border after:content-[''] after:flex-1 after:h-px after:bg-border">
          or
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
          Already have an account?{" "}
          <Link
            href={ROUTES.SIGNIN}
            className="relative text-primary motion-safe:transition-colors duration-200 ease-in-out hover:opacity-80 after:content-[''] after:absolute after:-bottom-0.5 after:left-0 after:h-0.5 after:w-full after:origin-bottom-right after:scale-x-0 after:bg-current after:transition-transform after:duration-300 after:ease-in-out hover:after:scale-x-100 hover:after:origin-bottom-left"
          >
            Sign in
          </Link>
        </p>
      </form>
    </section>
  );
}
