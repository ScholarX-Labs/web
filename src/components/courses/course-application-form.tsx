"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleGauge,
  Compass,
  GraduationCap,
  Loader2,
  NotebookPen,
  Sparkles,
  Send,
  ShieldCheck,
  Target,
  UserRound,
} from "lucide-react";
import { DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useSession } from "@/lib/auth-client";
import { Course } from "@/types/course.types";
import {
  EnrollmentContext,
  EnrollmentExecutionResult,
  EnrollmentExecutionSuccess,
} from "@/lib/enrollment/types";
import { executeCourseApplication } from "@/lib/enrollment/strategies/course-application.strategy";
import { learnerStatusValues } from "@/domain/courses/application/course-application.schemas";
import { createEnrollmentExecutionContext } from "@/lib/enrollment/create-enrollment-execution-context";

interface CourseApplicationFormProps {
  course: Course;
  context: EnrollmentContext | null;
  shouldReduceMotion: boolean;
  overlayClassName: string;
  onSuccess: (result: EnrollmentExecutionSuccess) => void;
  onError: (message: string) => void;
  onSubmittingChange?: (isSubmitting: boolean) => void;
}

type LearnerStatus =
  | "high_school"
  | "undergraduate"
  | "graduate"
  | "professional";

type StepKey = "identity" | "status" | "story" | "review";

type FormState = {
  name: string;
  age: string;
  email: string;
  phone: string;
  learnerStatus: LearnerStatus;
  highSchoolName: string;
  university: string;
  faculty: string;
  graduationYear: string;
  workField: string;
  yearsOfExperience: string;
  personalStatement: string;
  learningGoals: string;
  background: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;
type TouchedState = Partial<Record<keyof FormState, boolean>>;

const steps: {
  key: StepKey;
  label: string;
  title: string;
  description: string;
  icon: typeof UserRound;
}[] = [
  {
    key: "identity",
    label: "Identity",
    title: "Tell us who you are",
    description: "We use this information to identify and contact you about the course.",
    icon: UserRound,
  },
  {
    key: "status",
    label: "Status",
    title: "Choose your current stage",
    description: "We only ask for the academic or professional fields relevant to you.",
    icon: GraduationCap,
  },
  {
    key: "story",
    label: "Story",
    title: "Add your background",
    description: "Give the reviewer enough context to understand your fit.",
    icon: NotebookPen,
  },
  {
    key: "review",
    label: "Goals & Review",
    title: "Finish your application",
    description: "State your learning goals and confirm the application before submitting.",
    icon: Target,
  },
];

const learnerStatusOptions: { value: LearnerStatus; label: string }[] = [
  { value: "high_school", label: "High School" },
  { value: "undergraduate", label: "Undergraduate" },
  { value: "graduate", label: "Graduate" },
  { value: "professional", label: "Professional" },
];

const numericFields: (keyof FormState)[] = ["age", "graduationYear", "yearsOfExperience"];
const currentYear = new Date().getUTCFullYear();

const initialState = (name?: string, email?: string, phone?: string): FormState => ({
  name: name ?? "",
  age: "",
  email: email ?? "",
  phone: phone ?? "",
  learnerStatus: "undergraduate",
  highSchoolName: "",
  university: "",
  faculty: "",
  graduationYear: "",
  workField: "",
  yearsOfExperience: "",
  personalStatement: "",
  learningGoals: "",
  background: "",
});

const inputClassName = (error?: string) =>
  `mt-2 block w-full rounded-2xl border px-4 py-3 text-sm shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 ${
    error
      ? "border-rose-300 bg-rose-50/80 text-slate-950 shadow-rose-200/50 ring-rose-200 dark:border-rose-500/60 dark:bg-rose-950/20 dark:text-white dark:ring-rose-500/20"
      : "border-slate-200/80 bg-white/90 text-slate-950 focus:border-cyan-400 dark:border-slate-800 dark:bg-slate-950/50 dark:text-white"
  }`;

export function CourseApplicationForm({
  course,
  context,
  shouldReduceMotion,
  overlayClassName,
  onSuccess,
  onError,
  onSubmittingChange,
}: CourseApplicationFormProps) {
  const { data: session } = useSession();
  const [form, setForm] = useState<FormState>(() =>
    initialState(
      session?.user?.name,
      session?.user?.email,
      session?.user?.phoneNumber ?? undefined,
    ),
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<TouchedState>({});
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<EnrollmentExecutionResult | null>(null);

  useEffect(() => {
    if (!session?.user) return;

    setForm((current) => {
      const nextName = session.user.name ?? "";
      const nextEmail = session.user.email ?? "";
      const nextPhone = session.user.phoneNumber ?? "";

      const shouldHydrateName = !current.name.trim() && Boolean(nextName);
      const shouldHydrateEmail = !current.email.trim() && Boolean(nextEmail);
      const shouldHydratePhone = !current.phone.trim() && Boolean(nextPhone);

      if (!shouldHydrateName && !shouldHydrateEmail && !shouldHydratePhone) {
        return current;
      }

      return {
        ...current,
        ...(shouldHydrateName ? { name: nextName } : {}),
        ...(shouldHydrateEmail ? { email: nextEmail } : {}),
        ...(shouldHydratePhone ? { phone: nextPhone } : {}),
      };
    });
  }, [session]);

  const currentStep = steps[currentStepIndex];
  const CurrentStepIcon = currentStep.icon;

  const statusSummary = useMemo(() => {
    switch (form.learnerStatus) {
      case "high_school":
        return form.highSchoolName || "High school details missing";
      case "undergraduate":
        return [form.university, form.faculty].filter(Boolean).join(" - ") || "University details missing";
      case "graduate":
        return [form.university, form.faculty, form.graduationYear].filter(Boolean).join(" - ") || "Graduate details missing";
      case "professional":
        return [form.workField, form.yearsOfExperience ? `${form.yearsOfExperience} years` : ""]
          .filter(Boolean)
          .join(" - ") || "Professional details missing";
    }
  }, [form]);

  const completionRatio = useMemo(() => {
    const relevantFields: (keyof FormState)[] = [
      "name",
      "age",
      "email",
      "phone",
      "learnerStatus",
      "personalStatement",
      "learningGoals",
      "background",
      ...(
        form.learnerStatus === "high_school" ? (["highSchoolName"] as (keyof FormState)[]) : []
      ),
      ...(
        form.learnerStatus === "undergraduate"
          ? (["university", "faculty"] as (keyof FormState)[])
          : []
      ),
      ...(form.learnerStatus === "graduate"
        ? (["university", "faculty", "graduationYear"] as (keyof FormState)[])
        : []),
      ...(form.learnerStatus === "professional"
        ? (["workField", "yearsOfExperience"] as (keyof FormState)[])
        : []),
    ];

    const completed = relevantFields.filter((field) => form[field].trim().length > 0).length;
    return Math.round((completed / relevantFields.length) * 100);
  }, [form]);

  const validateField = (field: keyof FormState, nextForm: FormState): string | undefined => {
    const value = nextForm[field].trim();
    const age = Number(nextForm.age);
    const graduationYear = Number(nextForm.graduationYear);
    const experience = Number(nextForm.yearsOfExperience);

    switch (field) {
      case "name":
        return value.length >= 2 ? undefined : "Enter your full name.";
      case "age":
        if (!value) return "Age is required.";
        if (!/^\d+$/.test(value)) return "Age must be a whole number.";
        if (age < 13 || age > 80) return "Age must be between 13 and 80.";
        if (
          nextForm.learnerStatus === "graduate" &&
          age < 20
        ) {
          return "Graduate applicants must enter a realistic age.";
        }
        return undefined;
      case "email":
        if (!value) return "Email address is required.";
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
          ? undefined
          : "Enter a valid email address.";
      case "phone": {
        if (!value) return "Phone number is required.";
        const digits = value.replace(/\D/g, "");
        if (digits.length < 7 || digits.length > 15) {
          return "Phone number must have 7 to 15 digits.";
        }
        return /^[+\d\s().-]+$/.test(value) ? undefined : "Enter a valid phone number.";
      }
      case "highSchoolName":
        return nextForm.learnerStatus !== "high_school" || value
          ? undefined
          : "High school name is required.";
      case "university":
        return !["undergraduate", "graduate"].includes(nextForm.learnerStatus) || value
          ? undefined
          : "University is required.";
      case "faculty":
        return !["undergraduate", "graduate"].includes(nextForm.learnerStatus) || value
          ? undefined
          : "Faculty is required.";
      case "graduationYear":
        if (nextForm.learnerStatus !== "graduate") return undefined;
        if (!value) return "Graduation year is required.";
        if (!/^\d{4}$/.test(value)) return "Graduation year must be four digits.";
        if (graduationYear < currentYear - 60 || graduationYear > currentYear + 1) {
          return "Enter a realistic graduation year.";
        }
        return undefined;
      case "workField":
        return nextForm.learnerStatus !== "professional" || value
          ? undefined
          : "Work field is required.";
      case "yearsOfExperience":
        if (nextForm.learnerStatus !== "professional") return undefined;
        if (!value) return "Years of experience is required.";
        if (!/^\d+$/.test(value)) return "Years of experience must be a whole number.";
        if (experience < 0 || experience > 60) return "Enter a realistic experience range.";
        if (!Number.isNaN(age) && experience > Math.max(age - 14, 0)) {
          return "Years of experience is too high for the entered age.";
        }
        return undefined;
      case "personalStatement":
        return value.length >= 30 ? undefined : "Write at least 30 characters about yourself.";
      case "learningGoals":
        return value.length >= 30 ? undefined : "Write at least 30 characters for your goals.";
      case "background":
        return value.length >= 30 ? undefined : "Write at least 30 characters for your background.";
      case "learnerStatus":
        return learnerStatusValues.includes(nextForm.learnerStatus) ? undefined : "Choose a valid learner status.";
      default:
        return undefined;
    }
  };

  const relatedFieldsFor = (field: keyof FormState): (keyof FormState)[] => {
    if (field === "learnerStatus") {
      return [
        "learnerStatus",
        "highSchoolName",
        "university",
        "faculty",
        "graduationYear",
        "workField",
        "yearsOfExperience",
        "age",
      ];
    }

    if (field === "age") {
      return ["age", "yearsOfExperience"];
    }

    return [field];
  };

  const setField = (field: keyof FormState, value: string) => {
    const nextValue = numericFields.includes(field)
      ? value.replace(/[^\d]/g, "")
      : value;

    setForm((prev) => {
      const nextForm = { ...prev, [field]: nextValue };
      const fieldsToValidate = relatedFieldsFor(field);

      setErrors((prevErrors) => {
        const nextErrors = { ...prevErrors };
        for (const relatedField of fieldsToValidate) {
          if (touched[relatedField] || relatedField === field || prevErrors[relatedField]) {
            nextErrors[relatedField] = validateField(relatedField, nextForm);
          }
        }
        return nextErrors;
      });

      return nextForm;
    });
  };

  const markTouched = (field: keyof FormState) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({
      ...prev,
      [field]: validateField(field, form),
    }));
  };

  const validateStep = (stepKey: StepKey): FormErrors => {
    const nextErrors: FormErrors = {};

    if (stepKey === "identity") {
      nextErrors.name = validateField("name", form);
      nextErrors.age = validateField("age", form);
      nextErrors.email = validateField("email", form);
      nextErrors.phone = validateField("phone", form);
    }

    if (stepKey === "status") {
      nextErrors.highSchoolName = validateField("highSchoolName", form);
      nextErrors.university = validateField("university", form);
      nextErrors.faculty = validateField("faculty", form);
      nextErrors.graduationYear = validateField("graduationYear", form);
      nextErrors.workField = validateField("workField", form);
      nextErrors.yearsOfExperience = validateField("yearsOfExperience", form);
    }

    if (stepKey === "story") {
      nextErrors.personalStatement = validateField("personalStatement", form);
      nextErrors.background = validateField("background", form);
    }

    if (stepKey === "review") {
      nextErrors.learningGoals = validateField("learningGoals", form);
    }

    return Object.fromEntries(
      Object.entries(nextErrors).filter(([, value]) => Boolean(value)),
    ) as FormErrors;
  };

  const goNext = () => {
    const stepErrors = validateStep(currentStep.key);
    if (Object.keys(stepErrors).length > 0) {
      setTouched((prev) => ({
        ...prev,
        ...Object.fromEntries(Object.keys(stepErrors).map((key) => [key, true])),
      }));
      setErrors((prev) => ({ ...prev, ...stepErrors }));
      
      const firstErrorField = Object.keys(stepErrors)[0];
      if (firstErrorField) {
        document.getElementById(`field-${firstErrorField}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    setCurrentStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const mergedErrors = steps.reduce<FormErrors>(
      (acc, step) => ({ ...acc, ...validateStep(step.key) }),
      {},
    );

    if (Object.keys(mergedErrors).length > 0) {
      setTouched((prev) => ({
        ...prev,
        ...Object.fromEntries(Object.keys(mergedErrors).map((key) => [key, true])),
      }));
      setErrors(mergedErrors);
      const firstInvalidStepIndex = steps.findIndex((step) =>
        Object.keys(validateStep(step.key)).length > 0,
      );
      if (firstInvalidStepIndex >= 0) {
        setCurrentStepIndex(firstInvalidStepIndex);
        
        // Wait a tick for the step to render, then scroll to the first error
        setTimeout(() => {
          const firstErrorField = Object.keys(mergedErrors)[0];
          if (firstErrorField) {
            document.getElementById(`field-${firstErrorField}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 100);
      } else {
        const firstErrorField = Object.keys(mergedErrors)[0];
        if (firstErrorField) {
          document.getElementById(`field-${firstErrorField}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
      return;
    }

    setIsSubmitting(true);
    onSubmittingChange?.(true);
    setErrors({});

    try {
      const result = await executeCourseApplication(
        createEnrollmentExecutionContext(course, context, shouldReduceMotion),
        {
        name: form.name.trim(),
        age: Number(form.age),
        email: form.email.trim(),
        phone: form.phone.trim(),
        learnerStatus: form.learnerStatus,
        highSchoolName: form.highSchoolName.trim() || undefined,
        university: form.university.trim() || undefined,
        faculty: form.faculty.trim() || undefined,
        graduationYear: form.graduationYear ? Number(form.graduationYear) : undefined,
        workField: form.workField.trim() || undefined,
        yearsOfExperience: form.yearsOfExperience
          ? Number(form.yearsOfExperience)
          : undefined,
        personalStatement: form.personalStatement.trim(),
        learningGoals: form.learningGoals.trim(),
        background: form.background.trim(),
      },
      );

      setSubmitResult(result);

      if (result.ok) {
        onSuccess(result);
        return;
      }

      onError(result.message);
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Unexpected error";
      const failureResult: EnrollmentExecutionResult = {
        ok: false,
        mode: "application",
        code: "unknown",
        message,
      };
      setSubmitResult(failureResult);
      onError("Something went wrong while submitting your application. Please try again.");
    } finally {
      setIsSubmitting(false);
      onSubmittingChange?.(false);
    }
  };

  const renderError = (error?: string) =>
    error ? (
      <p className="mt-2 flex items-center gap-1 text-xs text-rose-500">
        <AlertCircle className="h-3.5 w-3.5" />
        {error}
      </p>
    ) : null;

  return (
    <DialogContent
      overlayClassName={overlayClassName}
      className="z-90 overflow-hidden rounded-[24px] sm:rounded-[30px] border border-white/60 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),_transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.94))] p-0 shadow-[0_40px_120px_rgba(15,23,42,0.28)] backdrop-blur-2xl dark:border-white/10 dark:bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.16),_transparent_28%),linear-gradient(180deg,rgba(2,6,23,0.94),rgba(15,23,42,0.96))] w-[calc(100vw-24px)] max-w-none sm:w-[90vw] sm:max-w-5xl h-[96vh] sm:h-auto sm:max-h-[90vh] flex flex-col"
    >
      <DialogTitle className="sr-only">Apply for {course.title}</DialogTitle>

      {submitResult?.ok ? (
        <div className="flex min-h-[620px] items-center justify-center px-6 py-10">
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="mx-auto flex max-w-lg flex-col items-center gap-5 text-center"
          >
            <div className="rounded-full border border-emerald-200/80 bg-emerald-100/90 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
              <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold text-slate-950 dark:text-white">
                Application submitted
              </h3>
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                Your application for {course.title} is now pending review. We will
                contact you at <strong>{form.email}</strong> with the next step.
              </p>
            </div>
          </motion.div>
        </div>
      ) : (
        <div className="flex flex-col lg:grid flex-1 min-h-0 lg:min-h-[620px] lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="relative flex-none overflow-hidden border-b border-white/50 bg-[linear-gradient(180deg,rgba(14,165,233,0.12),rgba(249,115,22,0.08),rgba(255,255,255,0.4))] p-5 sm:p-6 dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(14,165,233,0.16),rgba(249,115,22,0.08),rgba(15,23,42,0.12))] lg:border-b-0 lg:border-r">
            <div className="absolute inset-x-5 top-0 h-24 rounded-b-full bg-cyan-400/15 blur-3xl dark:bg-cyan-400/10" />
            <div className="mb-6 flex items-start gap-3">
              <div className="rounded-2xl border border-white/50 bg-white/80 p-3 text-cyan-600 shadow-sm dark:border-white/10 dark:bg-slate-950/70 dark:text-cyan-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Application required
                </p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">
                  {course.title}
                </h2>
              </div>
            </div>

            <div className="relative mb-6 rounded-3xl border border-white/60 bg-white/70 p-4 shadow-sm dark:border-white/10 dark:bg-slate-950/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-950 dark:text-white">
                  <CircleGauge className="h-4 w-4 text-cyan-500" />
                  <span className="text-sm font-medium">Application progress</span>
                </div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {completionRatio}%
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-500 to-orange-500"
                  animate={{ width: `${completionRatio}%` }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.35 }}
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <Badge icon={Sparkles} label="Secure review" tone="cyan" />
                <Badge icon={Compass} label="Guided steps" tone="orange" />
              </div>
            </div>

            <div className="hidden lg:block space-y-3">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStepIndex;
                const isComplete = index < currentStepIndex;

                return (
                  <div
                    key={step.key}
                    className={`rounded-2xl border px-4 py-3 transition ${
                      isActive
                        ? "border-cyan-300/70 bg-gradient-to-r from-cyan-50 via-white to-orange-50 dark:border-cyan-500/40 dark:bg-[linear-gradient(90deg,rgba(6,182,212,0.12),rgba(255,255,255,0.03),rgba(249,115,22,0.08))]"
                        : "border-white/50 bg-white/55 dark:border-white/10 dark:bg-slate-950/40"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                          isComplete
                            ? "bg-emerald-500 text-white"
                            : isActive
                              ? "bg-gradient-to-br from-cyan-500 to-orange-500 text-white"
                              : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {isComplete ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-950 dark:text-white">
                          {step.label}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col bg-white dark:bg-slate-950/50">
            <div className="flex-none border-b border-white/50 bg-[linear-gradient(90deg,rgba(14,165,233,0.08),rgba(255,255,255,0.4),rgba(249,115,22,0.08))] px-5 py-5 dark:border-white/10 dark:bg-[linear-gradient(90deg,rgba(14,165,233,0.08),rgba(255,255,255,0.01),rgba(249,115,22,0.06))] sm:px-8">
              <div className="flex items-center gap-3 text-cyan-600 dark:text-cyan-400">
                <div className="rounded-xl border border-current/20 bg-current/10 p-2">
                  <CurrentStepIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium">{currentStep.label}</p>
                  <h3 className="text-lg sm:text-2xl font-semibold text-slate-950 dark:text-white">
                    {currentStep.title}
                  </h3>
                  <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    {currentStep.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto scholar-scrollbar px-5 py-6 sm:px-8 relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep.key}
                  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -18 }}
                  transition={{ duration: 0.24 }}
                  className="space-y-5"
                >
                  {currentStep.key === "identity" ? (
                    <div className="grid gap-5 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="field-name">
                          Full name
                        </label>
                        <input id="field-name" className={inputClassName(errors.name)} value={form.name} onChange={(e) => setField("name", e.target.value)} onBlur={() => markTouched("name")} />
                        {renderError(errors.name)}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="field-age">
                          Age
                        </label>
                        <input id="field-age" className={inputClassName(errors.age)} inputMode="numeric" value={form.age} onChange={(e) => setField("age", e.target.value)} onBlur={() => markTouched("age")} />
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                          Whole number only. Allowed range: 13 to 80.
                        </p>
                        {renderError(errors.age)}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="field-phone">
                          Phone number
                        </label>
                        <input id="field-phone" className={inputClassName(errors.phone)} value={form.phone} onChange={(e) => setField("phone", e.target.value)} onBlur={() => markTouched("phone")} />
                        {renderError(errors.phone)}
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="field-email">
                          Email address
                        </label>
                        <input id="field-email" className={inputClassName(errors.email)} type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} onBlur={() => markTouched("email")} />
                        {renderError(errors.email)}
                      </div>
                    </div>
                  ) : null}

                  {currentStep.key === "status" ? (
                    <div className="space-y-5">
                      <div className="grid gap-3 sm:grid-cols-2">
                        {learnerStatusOptions.map((option) => (
                          <button
                            key={option.value}
                            id={`field-learnerStatus-${option.value}`}
                            type="button"
                            onClick={() => {
                              setField("learnerStatus", option.value);
                              // Keep a generic anchor for scrolling
                              document.getElementById("field-learnerStatus")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                            }}
                            className={`rounded-2xl border px-4 py-4 text-left transition ${
                              form.learnerStatus === option.value
                                ? "border-cyan-400 bg-gradient-to-br from-cyan-50 via-white to-orange-50 text-slate-950 shadow-lg shadow-cyan-100/60 dark:border-cyan-500 dark:bg-[linear-gradient(135deg,rgba(6,182,212,0.12),rgba(249,115,22,0.08))] dark:text-white"
                                : "border-slate-200/80 bg-white/70 text-slate-700 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-200"
                            }`}
                          >
                            <div className="font-medium">{option.label}</div>
                          </button>
                        ))}
                      </div>
                      {/* Hidden anchor for scrolling to learner status errors */}
                      <div id="field-learnerStatus" />

                      {form.learnerStatus === "high_school" ? (
                        <div>
                          <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="field-highSchoolName">
                            High school name
                          </label>
                          <input id="field-highSchoolName" className={inputClassName(errors.highSchoolName)} value={form.highSchoolName} onChange={(e) => setField("highSchoolName", e.target.value)} onBlur={() => markTouched("highSchoolName")} />
                          {renderError(errors.highSchoolName)}
                        </div>
                      ) : null}

                      {(form.learnerStatus === "undergraduate" || form.learnerStatus === "graduate") ? (
                        <div className="grid gap-5 md:grid-cols-2">
                          <div>
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="field-university">
                              University
                            </label>
                            <input id="field-university" className={inputClassName(errors.university)} value={form.university} onChange={(e) => setField("university", e.target.value)} onBlur={() => markTouched("university")} />
                            {renderError(errors.university)}
                          </div>
                          <div>
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="field-faculty">
                              Faculty
                            </label>
                            <input id="field-faculty" className={inputClassName(errors.faculty)} value={form.faculty} onChange={(e) => setField("faculty", e.target.value)} onBlur={() => markTouched("faculty")} />
                            {renderError(errors.faculty)}
                          </div>
                          {form.learnerStatus === "graduate" ? (
                            <div>
                              <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="field-graduationYear">
                                Graduation year
                              </label>
                              <input id="field-graduationYear" className={inputClassName(errors.graduationYear)} inputMode="numeric" value={form.graduationYear} onChange={(e) => setField("graduationYear", e.target.value)} onBlur={() => markTouched("graduationYear")} />
                              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                Four digits only. Allowed range: {currentYear - 60} to {currentYear + 1}.
                              </p>
                              {renderError(errors.graduationYear)}
                            </div>
                          ) : null}
                        </div>
                      ) : null}

                      {form.learnerStatus === "professional" ? (
                        <div className="grid gap-5 md:grid-cols-2">
                          <div>
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="field-workField">
                              Work field
                            </label>
                            <input id="field-workField" className={inputClassName(errors.workField)} value={form.workField} onChange={(e) => setField("workField", e.target.value)} onBlur={() => markTouched("workField")} />
                            {renderError(errors.workField)}
                          </div>
                          <div>
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="field-yearsOfExperience">
                              Years of experience
                            </label>
                            <input id="field-yearsOfExperience" className={inputClassName(errors.yearsOfExperience)} inputMode="numeric" value={form.yearsOfExperience} onChange={(e) => setField("yearsOfExperience", e.target.value)} onBlur={() => markTouched("yearsOfExperience")} />
                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                              Whole number only. Checked live against the entered age.
                            </p>
                            {renderError(errors.yearsOfExperience)}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {currentStep.key === "story" ? (
                    <div className="space-y-5">
                      <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="field-personalStatement">
                          Some words about you
                        </label>
                        <textarea id="field-personalStatement" rows={5} className={inputClassName(errors.personalStatement)} value={form.personalStatement} onChange={(e) => setField("personalStatement", e.target.value)} onBlur={() => markTouched("personalStatement")} />
                        <CharacterMeter value={form.personalStatement} minimum={30} />
                        {renderError(errors.personalStatement)}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="field-background">
                          Background
                        </label>
                        <textarea id="field-background" rows={5} className={inputClassName(errors.background)} value={form.background} onChange={(e) => setField("background", e.target.value)} onBlur={() => markTouched("background")} />
                        <CharacterMeter value={form.background} minimum={30} />
                        {renderError(errors.background)}
                      </div>
                    </div>
                  ) : null}

                  {currentStep.key === "review" ? (
                    <div className="space-y-5">
                      <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="field-learningGoals">
                          Learning goals
                        </label>
                        <textarea id="field-learningGoals" rows={5} className={inputClassName(errors.learningGoals)} value={form.learningGoals} onChange={(e) => setField("learningGoals", e.target.value)} onBlur={() => markTouched("learningGoals")} />
                        <CharacterMeter value={form.learningGoals} minimum={30} />
                        {renderError(errors.learningGoals)}
                      </div>

                      <div className="rounded-3xl border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(240,249,255,0.92))] p-5 shadow-sm dark:border-slate-800 dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.72),rgba(8,47,73,0.3))]">
                        <h4 className="text-sm font-semibold text-slate-950 dark:text-white">
                          Review summary
                        </h4>
                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <SummaryItem label="Applicant" value={form.name || "Not provided"} />
                          <SummaryItem label="Email" value={form.email || "Not provided"} />
                          <SummaryItem label="Phone" value={form.phone || "Not provided"} />
                          <SummaryItem
                            label="Status"
                            value={
                              learnerStatusOptions.find((option) => option.value === form.learnerStatus)?.label ??
                              form.learnerStatus
                            }
                          />
                          <SummaryItem label="Details" value={statusSummary} />
                        </div>
                      </div>
                    </div>
                  ) : null}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex-none flex items-center justify-between border-t border-white/50 bg-white dark:bg-slate-950 px-5 py-4 sm:px-8 dark:border-white/10">
              <button
                type="button"
                onClick={() => setCurrentStepIndex((prev) => Math.max(prev - 1, 0))}
                disabled={currentStepIndex === 0 || isSubmitting}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-2.5 text-sm font-medium text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-200"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>

              {currentStepIndex < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-slate-950 via-cyan-700 to-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/15 transition hover:brightness-110 dark:from-white dark:via-cyan-100 dark:to-white dark:text-slate-950"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {isSubmitting ? "Submitting..." : "Submit application"}
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </DialogContent>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60">
      <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-950 dark:text-white">
        {value}
      </p>
    </div>
  );
}

function Badge({
  icon: Icon,
  label,
  tone,
}: {
  icon: typeof Sparkles;
  label: string;
  tone: "cyan" | "orange" | "emerald";
}) {
  const tones = {
    cyan: "bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300",
    orange: "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300",
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ${tones[tone]}`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

function CharacterMeter({ value, minimum }: { value: string; minimum: number }) {
  const count = value.trim().length;
  const complete = count >= minimum;

  return (
    <div className="mt-2 flex items-center justify-between text-xs">
      <span className={complete ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}>
        {complete ? "Looks good" : `Need ${Math.max(minimum - count, 0)} more characters`}
      </span>
      <span className="text-slate-500 dark:text-slate-400">
        {count}/{minimum}+
      </span>
    </div>
  );
}
