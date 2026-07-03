"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
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
  createContactSchema,
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
  const t = useTranslations("contact.form");
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const contactSchema = useMemo(
    () =>
      createContactSchema({
        firstNameRequired: t("validation.firstNameRequired"),
        firstNameMax: t("validation.firstNameMax"),
        lastNameRequired: t("validation.lastNameRequired"),
        lastNameMax: t("validation.lastNameMax"),
        emailInvalid: t("validation.emailInvalid"),
        phoneNumberMax: t("validation.phoneNumberMax"),
        messageMin: t("validation.messageMin"),
        messageMax: t("validation.messageMax"),
      }),
    [t],
  );

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
      toast.success(t("toast.success"));

      window.setTimeout(() => {
        router.replace(ROUTES.HOME);
      }, REDIRECT_DELAY_MS);
    } catch {
      toast.error(t("toast.error"));
    }
  };

  const isBusy = isSubmitting || isRedirecting;

  return (
    <Card className="border-slate-200/80 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="text-2xl text-slate-900">
          {t("title")}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid gap-5"
          noValidate
          aria-label={t("ariaLabel")}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="firstName">{t("fields.firstName.label")}</FieldLabel>
              <FieldContent>
                <Input
                  id="firstName"
                  placeholder={t("fields.firstName.placeholder")}
                  aria-invalid={errors.firstName ? true : undefined}
                  disabled={isBusy}
                  {...register("firstName")}
                />
                <FieldError>{errors.firstName?.message}</FieldError>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="lastName">{t("fields.lastName.label")}</FieldLabel>
              <FieldContent>
                <Input
                  id="lastName"
                  placeholder={t("fields.lastName.placeholder")}
                  aria-invalid={errors.lastName ? true : undefined}
                  disabled={isBusy}
                  {...register("lastName")}
                />
                <FieldError>{errors.lastName?.message}</FieldError>
              </FieldContent>
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="email">{t("fields.email.label")}</FieldLabel>
            <FieldContent>
              <Input
                id="email"
                type="email"
                placeholder={t("fields.email.placeholder")}
                aria-invalid={errors.email ? true : undefined}
                disabled={isBusy}
                {...register("email")}
              />
              <FieldError>{errors.email?.message}</FieldError>
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="phoneNumber">{t("fields.phoneNumber.label")}</FieldLabel>
            <FieldContent>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder={t("fields.phoneNumber.placeholder")}
                aria-invalid={errors.phoneNumber ? true : undefined}
                disabled={isBusy}
                {...register("phoneNumber")}
              />
              <FieldError>{errors.phoneNumber?.message}</FieldError>
            </FieldContent>
          </Field>

          <Field className="min-w-0">
            <FieldLabel htmlFor="message">{t("fields.message.label")}</FieldLabel>
            <FieldContent className="min-w-0">
              <Textarea
                id="message"
                rows={6}
                className="max-h-64 resize-none"
                placeholder={t("fields.message.placeholder")}
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
            {isBusy ? t("submit.submitting") : t("submit.idle")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
