"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export default function PhoneForm() {
  const t = useTranslations("auth.collectPhone");
  const router = useRouter();
  const [phone, setPhone] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isValidPhoneNumber(phone)) {
      setError(t("errors.invalidPhone"));
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/collect-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || t("errors.saveFailed"));
        return;
      }
      router.replace("/");
    } catch {
      setError(t("errors.fallback"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="phone" className="text-sm font-medium leading-none">
          {t("label")}
        </label>
        <div className="flex h-9 w-full rounded-md border border-input bg-white px-3 shadow-sm focus-within:ring-1 focus-within:ring-ring">
          <PhoneInput
            id="phone"
            international
            defaultCountry="EG"
            placeholder={t("placeholder")}
            value={phone}
            onChange={(val) => setPhone(val ?? "")}
            className="w-full text-sm"
          />
        </div>
        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={submitting}
        className={
          "text-primary-foreground w-full sm:w-1/2 max-w-64 self-center " +
          (submitting ? "cursor-not-allowed" : "cursor-pointer")
        }
      >
        {submitting ? t("saving") : t("saveButton")}
      </Button>
    </form>
  );
}
