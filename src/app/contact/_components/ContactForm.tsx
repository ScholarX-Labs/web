"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ROUTES } from "@/lib/routes";
import {
  contactSchema,
  type ContactFormInput,
  type ContactFormValues,
} from "../contact.schema";

const REDIRECT_DELAY_MS = 100;

async function persistContactResponse(
  values: ContactFormValues,
): Promise<void> {
  const response = await fetch("/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });

  if (!response.ok) {
    throw new Error("Failed to persist contact message");
  }
}

export default function ContactForm() {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormInput, unknown, ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      message: "",
    },
  });

  const onSubmit = async (values: ContactFormValues) => {
    try {
      await persistContactResponse(values);
      reset();
      setIsRedirecting(true);
      toast.success("Your response was recorded.");

      window.setTimeout(() => {
        router.replace(ROUTES.HOME);
      }, REDIRECT_DELAY_MS);
    } catch {
      toast.error("We could not record your response. Please try again.");
    }
  };

  const isBusy = isSubmitting || isRedirecting;

  return (
    <Card className="border-slate-200/80 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="text-2xl text-slate-900">
          Send us a message
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid gap-5"
          noValidate
          aria-label="Contact us form"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="firstName">First name</FieldLabel>
              <FieldContent>
                <Input
                  id="firstName"
                  placeholder="Enter your first name"
                  aria-invalid={errors.firstName ? true : undefined}
                  disabled={isBusy}
                  {...register("firstName")}
                />
                <FieldError>{errors.firstName?.message}</FieldError>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="lastName">Last name</FieldLabel>
              <FieldContent>
                <Input
                  id="lastName"
                  placeholder="Enter your last name"
                  aria-invalid={errors.lastName ? true : undefined}
                  disabled={isBusy}
                  {...register("lastName")}
                />
                <FieldError>{errors.lastName?.message}</FieldError>
              </FieldContent>
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <FieldContent>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                aria-invalid={errors.email ? true : undefined}
                disabled={isBusy}
                {...register("email")}
              />
              <FieldError>{errors.email?.message}</FieldError>
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="phoneNumber">
              Phone number (optional)
            </FieldLabel>
            <FieldContent>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+20 123 456 7890"
                aria-invalid={errors.phoneNumber ? true : undefined}
                disabled={isBusy}
                {...register("phoneNumber")}
              />
              <FieldError>{errors.phoneNumber?.message}</FieldError>
            </FieldContent>
          </Field>

          <Field className="min-w-0">
            <FieldLabel htmlFor="message">Message</FieldLabel>
            <FieldContent className="min-w-0">
              <Textarea
                id="message"
                rows={6}
                className="max-h-64 resize-none"
                placeholder="Tell us how we can help"
                aria-invalid={errors.message ? true : undefined}
                disabled={isBusy}
                {...register("message")}
              />
              <FieldError>{errors.message?.message}</FieldError>
            </FieldContent>
          </Field>

          <Button
            type="submit"
            disabled={isBusy}
            className="h-10 w-full sm:w-auto sm:min-w-44 hover:cursor-pointer"
          >
            {isBusy ? "Submitting..." : "Submit"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
