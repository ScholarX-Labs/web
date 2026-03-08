"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Field from "@/app/(auth)/_components/Field";
import { Button } from "@/components/ui/button";
import { signUp } from "@/lib/auth-client";

const passwordRequirements = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/;

const signupSchema = z
  .object({
    firstName: z.string().min(1, { message: "First name is required" }).max(50),
    lastName: z.string().min(1, { message: "Last name is required" }).max(50),
    email: z.string().email({ message: "Enter a valid email address" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" })
      .max(128, { message: "Password is too long" })
      .regex(passwordRequirements, {
        message:
          "Password must include uppercase, lowercase, number and special character",
      }),
    confirmPassword: z.string(),
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
    formState: { errors, isSubmitting },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: SignupForm) => {
    setServerError(null);
    const { confirmPassword, ...payload } = data;

    const { error } = await signUp.email({
      email: payload.email,
      password: payload.password,
      name: `${payload.firstName} ${payload.lastName}`,
      firstName: payload.firstName,
      lastName: payload.lastName,
    });

    if (error) {
      setServerError(
        error.message ?? "Something went wrong. Please try again.",
      );
    }
  };

  return (
    <section
      about="signup-form"
      className="bg-primary h-full w-full flex justify-center items-center p-4"
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-primary-foreground max-w-2/3 w-full p-6 rounded-2xl flex flex-col gap-4"
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
        <Button
          type="submit"
          disabled={isSubmitting}
          className={
            "text-primary-foreground " +
            (isSubmitting ? "cursor-not-allowed" : "cursor-pointer")
          }
        >
          {isSubmitting ? "Loading..." : "Sign up"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
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
