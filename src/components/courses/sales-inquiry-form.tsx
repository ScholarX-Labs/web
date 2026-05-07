"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { executeSalesInquiry } from "@/lib/enrollment/strategies/sales-inquiry.strategy";
import {
  EnrollmentContext,
  EnrollmentExecutionResult,
} from "@/lib/enrollment/types";

interface SalesInquiryFormProps {
  course: {
    id: string;
    slug: string;
    title: string;
    requiresForm: boolean;
    salesInquiry?: boolean;
    price?: number;
  };
  context: EnrollmentContext | null;
  shouldReduceMotion: boolean;
  onSuccess: () => void;
  onError: (message: string) => void;
}

interface FormState {
  name: string;
  email: string;
  phone: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
}

export function SalesInquiryForm({
  course,
  context,
  shouldReduceMotion,
  onSuccess,
  onError,
}: SalesInquiryFormProps) {
  const { data: session } = useSession();
  const [form, setForm] = useState<FormState>({
    name: session?.user?.name ?? "",
    email: session?.user?.email ?? "",
    phone: "",
    message: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] =
    useState<EnrollmentExecutionResult | null>(null);

  const validate = useCallback((): FormErrors => {
    const errs: FormErrors = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.email.trim()) {
      errs.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = "Invalid email address";
    }
    return errs;
  }, [form]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    const executionContext = context ?? {
      command: {
        courseId: course.id,
        source: "deep_link" as const,
        correlationId:
          typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        timestamp: Date.now(),
        viewport:
          typeof window !== "undefined" && window.innerWidth >= 1024
            ? "desktop" as const
            : "mobile" as const,
        reducedMotion: shouldReduceMotion,
      },
      course: {
        id: course.id,
        slug: course.slug,
        title: course.title,
        requiresForm: course.requiresForm,
        salesInquiry: course.salesInquiry,
        price: course.price,
      },
    };

    const result = await executeSalesInquiry(executionContext, {
      name: form.name,
      email: form.email,
      phone: form.phone || undefined,
      message: form.message || undefined,
    });

    setIsSubmitting(false);
    setSubmitResult(result);

    if (result.ok) {
      onSuccess();
    } else {
      onError(result.message);
    }
  };

  if (submitResult?.ok) {
    return (
      <motion.div
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4 py-8 text-center"
      >
        <div className="rounded-full bg-emerald-100 p-3 dark:bg-emerald-900/30">
          <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Inquiry Submitted
          </h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Thank you for your interest! Our team will review your inquiry and
            contact you at <strong>{form.email}</strong> within 1-2 business days.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 px-6 pb-6">
      <div>
        <label
          htmlFor="inquiry-name"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          id="inquiry-name"
          name="name"
          type="text"
          value={form.name}
          onChange={handleChange}
          disabled={isSubmitting}
          className={`mt-1 block w-full rounded-xl border ${
            errors.name
              ? "border-red-300 ring-1 ring-red-200"
              : "border-slate-200 dark:border-slate-700"
          } bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-hero-blue focus:outline-none focus:ring-2 focus:ring-hero-blue/20 disabled:opacity-60 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500`}
          placeholder="John Doe"
        />
        <AnimatePresence>
          {errors.name && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-1 flex items-center gap-1 text-xs text-red-500"
            >
              <AlertCircle className="h-3 w-3" />
              {errors.name}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div>
        <label
          htmlFor="inquiry-email"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Email Address <span className="text-red-500">*</span>
        </label>
        <input
          id="inquiry-email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          disabled={isSubmitting}
          className={`mt-1 block w-full rounded-xl border ${
            errors.email
              ? "border-red-300 ring-1 ring-red-200"
              : "border-slate-200 dark:border-slate-700"
          } bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-hero-blue focus:outline-none focus:ring-2 focus:ring-hero-blue/20 disabled:opacity-60 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500`}
          placeholder="john@example.com"
        />
        <AnimatePresence>
          {errors.email && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-1 flex items-center gap-1 text-xs text-red-500"
            >
              <AlertCircle className="h-3 w-3" />
              {errors.email}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div>
        <label
          htmlFor="inquiry-phone"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Phone Number <span className="text-slate-400">(optional)</span>
        </label>
        <input
          id="inquiry-phone"
          name="phone"
          type="tel"
          value={form.phone}
          onChange={handleChange}
          disabled={isSubmitting}
          className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-hero-blue focus:outline-none focus:ring-2 focus:ring-hero-blue/20 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
          placeholder="+1 (555) 000-0000"
        />
      </div>

      <div>
        <label
          htmlFor="inquiry-message"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Message <span className="text-slate-400">(optional)</span>
        </label>
        <textarea
          id="inquiry-message"
          name="message"
          rows={3}
          value={form.message}
          onChange={handleChange}
          disabled={isSubmitting}
          className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-hero-blue focus:outline-none focus:ring-2 focus:ring-hero-blue/20 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
          placeholder="Tell us about your learning goals or any questions..."
        />
      </div>

      <motion.div
        whileHover={isSubmitting ? undefined : { scale: 1.015 }}
        whileTap={isSubmitting ? undefined : { scale: 0.985 }}
      >
        <button
          type="submit"
          disabled={isSubmitting}
          className="relative w-full overflow-hidden rounded-xl bg-linear-to-r from-hero-blue to-hero-blue-dark py-4 font-bold text-white shadow-lg shadow-hero-blue/20 transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {!shouldReduceMotion && (
            <motion.span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-[-34%] w-[36%] bg-linear-to-r from-transparent via-white/40 to-transparent"
              animate={isSubmitting ? { x: ["0%", "270%"] } : undefined}
              transition={
                isSubmitting
                  ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
                  : undefined
              }
            />
          )}

          <span className="relative z-10 flex items-center justify-center gap-2">
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit Inquiry
              </>
            )}
          </span>
        </button>
      </motion.div>

      <p className="text-center text-xs text-slate-500 dark:text-slate-400">
        Our team will review your inquiry and contact you within 1-2 business days.
        No payment is required at this stage.
      </p>
    </form>
  );
}
