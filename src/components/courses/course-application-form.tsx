"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";
import { DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useSession } from "@/lib/auth-client";
import { Course } from "@/types/course.types";
import {
  EnrollmentContext,
  EnrollmentExecutionResult,
} from "@/lib/enrollment/types";
import { executeCourseApplication } from "@/lib/enrollment/strategies/course-application.strategy";

interface CourseApplicationFormProps {
  course: Course;
  context: EnrollmentContext | null;
  shouldReduceMotion: boolean;
  overlayClassName: string;
  onSuccess: () => void;
  onError: (message: string) => void;
}

interface FormState {
  name: string;
  email: string;
  phone: string;
  learningGoals: string;
  background: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  learningGoals?: string;
}

export function CourseApplicationForm({
  course,
  context,
  shouldReduceMotion,
  overlayClassName,
  onSuccess,
  onError,
}: CourseApplicationFormProps) {
  const { data: session } = useSession();
  const [form, setForm] = useState<FormState>({
    name: session?.user?.name ?? "",
    email: session?.user?.email ?? "",
    phone: "",
    learningGoals: "",
    background: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] =
    useState<EnrollmentExecutionResult | null>(null);

  const validate = useCallback((): FormErrors => {
    const nextErrors: FormErrors = {};
    if (!form.name.trim()) nextErrors.name = "Name is required";
    if (!form.email.trim()) {
      nextErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = "Invalid email address";
    }
    if (!form.learningGoals.trim()) {
      nextErrors.learningGoals = "Learning goals are required";
    }
    return nextErrors;
  }, [form]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const buildExecutionContext = (): EnrollmentContext =>
    context ?? {
      command: {
        courseId: course.id,
        source: "deep_link",
        correlationId:
          typeof crypto !== "undefined" &&
          typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        timestamp: Date.now(),
        viewport:
          typeof window !== "undefined" && window.innerWidth >= 1024
            ? "desktop"
            : "mobile",
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    const result = await executeCourseApplication(buildExecutionContext(), {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      learningGoals: form.learningGoals.trim(),
      background: form.background.trim() || undefined,
    });

    setIsSubmitting(false);
    setSubmitResult(result);

    if (result.ok) {
      onSuccess();
    } else {
      onError(result.message);
    }
  };

  const errorText = (error?: string) => (
    <AnimatePresence>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="mt-1 flex items-center gap-1 text-xs text-red-500"
        >
          <AlertCircle className="h-3 w-3" />
          {error}
        </motion.p>
      )}
    </AnimatePresence>
  );

  return (
    <DialogContent
      overlayClassName={overlayClassName}
      className="z-90 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-3xl border border-slate-200/90 bg-white/95 p-0 shadow-[0_32px_95px_rgba(2,6,23,0.28)] ring-1 ring-slate-100/80 backdrop-blur-xl dark:border-slate-800 dark:bg-card/95 dark:ring-slate-800/80 sm:max-w-lg"
    >
      <DialogTitle className="sr-only">Apply for {course.title}</DialogTitle>

      {submitResult?.ok ? (
        <motion.div
          initial={
            shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }
          }
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4 px-6 py-10 text-center"
        >
          <div className="rounded-full bg-emerald-100 p-3 dark:bg-emerald-900/30">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Application Submitted
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
              Your application for {course.title} is now pending review. We will
              contact you at <strong>{form.email}</strong> with the next step.
            </p>
          </div>
        </motion.div>
      ) : (
        <>
          <div className="border-b border-slate-100 px-6 pb-4 pt-6 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Apply for {course.title}
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              This course requires an application before enrollment.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 px-6 pb-6 pt-5">
            <div>
              <label
                htmlFor="application-name"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="application-name"
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
              {errorText(errors.name)}
            </div>

            <div>
              <label
                htmlFor="application-email"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                id="application-email"
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
              {errorText(errors.email)}
            </div>

            <div>
              <label
                htmlFor="application-phone"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Phone Number <span className="text-slate-400">(optional)</span>
              </label>
              <input
                id="application-phone"
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
                htmlFor="application-learning-goals"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Learning Goals <span className="text-red-500">*</span>
              </label>
              <textarea
                id="application-learning-goals"
                name="learningGoals"
                rows={4}
                value={form.learningGoals}
                onChange={handleChange}
                disabled={isSubmitting}
                className={`mt-1 block w-full rounded-xl border ${
                  errors.learningGoals
                    ? "border-red-300 ring-1 ring-red-200"
                    : "border-slate-200 dark:border-slate-700"
                } bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-hero-blue focus:outline-none focus:ring-2 focus:ring-hero-blue/20 disabled:opacity-60 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500`}
                placeholder="What do you want to achieve from this course?"
              />
              {errorText(errors.learningGoals)}
            </div>

            <div>
              <label
                htmlFor="application-background"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Background <span className="text-slate-400">(optional)</span>
              </label>
              <textarea
                id="application-background"
                name="background"
                rows={3}
                value={form.background}
                onChange={handleChange}
                disabled={isSubmitting}
                className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-hero-blue focus:outline-none focus:ring-2 focus:ring-hero-blue/20 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
                placeholder="Share relevant experience, availability, or questions."
              />
            </div>

            <motion.div
              whileHover={isSubmitting ? undefined : { scale: 1.01 }}
              whileTap={isSubmitting ? undefined : { scale: 0.99 }}
            >
              <button
                type="submit"
                disabled={isSubmitting}
                className="relative w-full overflow-hidden rounded-xl bg-linear-to-r from-hero-blue to-hero-blue-dark py-4 font-bold text-white shadow-lg shadow-hero-blue/20 transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit Application
                    </>
                  )}
                </span>
              </button>
            </motion.div>
          </form>
        </>
      )}
    </DialogContent>
  );
}
