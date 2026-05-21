"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateCourse } from "@/hooks/admin/use-admin-courses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Loader2, 
  ArrowLeft, 
  BookOpen, 
  Layout, 
  DollarSign, 
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { CATEGORY_CONFIG } from "@/lib/course-categories";
import { toast } from "sonner";
import { GlassCard } from "@/components/ui/glass-panel";
import ProgressIndicator from "@/components/ui/progress-indicator";

const courseSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  description: z.string().min(20, "Description must be at least 20 characters").max(2000),
  category: z.string().min(1, "Please select a category"),
  price: z.coerce.number().min(0, "Price cannot be negative"),
  requiresForm: z.boolean().default(false),
  autoApproveApplications: z.boolean().default(false),
});

type CourseFormValues = z.infer<typeof courseSchema>;

const slugify = (str: string) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

const STEPS = [
  { id: "identity", label: "Identity", icon: BookOpen },
  { id: "sector", label: "Sector", icon: Layout },
  { id: "valuation", label: "Valuation", icon: DollarSign },
];

export default function AdminNewCoursePage() {
  const router = useRouter();
  const createCourse = useCreateCourse();
  const [currentStep, setCurrentStep] = useState(0);

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema) as never,
    defaultValues: {
      title: "",
      description: "",
      category: "",
      price: 0,
      requiresForm: false,
      autoApproveApplications: false,
    },
    mode: "onChange",
  });

  const { formState: { errors } } = form;

  const nextStep = async () => {
    const fields = currentStep === 0 
      ? ["title", "description"] 
      : currentStep === 1 
      ? ["category"] 
      : ["price"];
    
    const isStepValid = await form.trigger(fields as (keyof CourseFormValues)[]);
    if (isStepValid && currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else if (isStepValid && currentStep === STEPS.length - 1) {
        form.handleSubmit(onSubmit)();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const onSubmit = async (values: CourseFormValues) => {
    try {
      const result = await createCourse.mutateAsync({
        ...values,
        slug: slugify(values.title),
      });
      const course = result as { id?: string };
      toast.success("Course synchronized with registry");
      if (course?.id) router.push(`/admin/courses/${course.id}`);
    } catch {
      toast.error("Synchronization failure");
    }
  };

  const currentIcon = STEPS[currentStep].icon;

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl space-y-8">
        <div className="flex flex-col items-center text-center space-y-2">
            <Link
                href="/admin/courses"
                className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-blue-600 transition-all mb-4"
            >
                <ArrowLeft className="size-3 transition-transform group-hover:-translate-x-1" strokeWidth={3} />
                Registry Core
            </Link>
            <h1 className="text-3xl font-[900] tracking-tight text-slate-900">Initialize Node</h1>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Protocol Step {currentStep + 1} of {STEPS.length}</p>
        </div>

        <GlassCard className="p-0 border-slate-200/50 shadow-2xl shadow-blue-500/5 overflow-hidden rounded-[32px] bg-white/80 backdrop-blur-2xl">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                <div className="flex items-center gap-4">
                    <div className="size-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                        {React.createElement(currentIcon, { className: "size-5 stroke-[2.5]" })}
                    </div>
                    <div>
                        <h3 className="font-[900] text-slate-900 tracking-tight">{STEPS[currentStep].label}</h3>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Stage Signal</p>
                    </div>
                </div>
                <ProgressIndicator 
                    step={currentStep + 1} 
                    totalSteps={STEPS.length} 
                    hideButtons 
                    className="gap-0"
                />
            </div>

            <div className="p-10">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
                        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                        exit={{ opacity: 0, scale: 1.02, filter: "blur(10px)" }}
                        transition={{ duration: 0.3, ease: "circOut" }}
                    >
                        {currentStep === 0 && (
                            <div className="space-y-8">
                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Entity Identity</label>
                                    <Input 
                                        {...form.register("title")}
                                        placeholder="e.g. Quantum Computing Fundamentals"
                                        className={cn(
                                            "h-14 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-8 focus:ring-blue-50 font-bold text-base transition-all px-6",
                                            errors.title && "border-rose-200 focus:ring-rose-50"
                                        )}
                                    />
                                    {errors.title && <p className="text-[10px] font-bold text-rose-500 uppercase ml-2">{errors.title.message}</p>}
                                </div>
                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Architectural Abstract</label>
                                    <Textarea 
                                        {...form.register("description")}
                                        placeholder="Core technical specifications..."
                                        rows={4}
                                        className={cn(
                                            "rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-8 focus:ring-blue-50 font-bold text-sm leading-relaxed transition-all p-6 resize-none",
                                            errors.description && "border-rose-200 focus:ring-rose-50"
                                        )}
                                    />
                                    {errors.description && <p className="text-[10px] font-bold text-rose-500 uppercase ml-2">{errors.description.message}</p>}
                                </div>
                            </div>
                        )}

                        {currentStep === 1 && (
                            <div className="space-y-8">
                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">System Sector</label>
                                    <Select 
                                        onValueChange={(v) => form.setValue("category", v, { shouldValidate: true })}
                                        defaultValue={form.getValues("category")}
                                    >
                                        <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-8 focus:ring-blue-50 font-bold text-base transition-all px-6">
                                            <SelectValue placeholder="Select classification..." />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                                            {Object.keys(CATEGORY_CONFIG).map((cat) => (
                                                <SelectItem key={cat} value={cat} className="rounded-xl font-bold py-3">
                                                    {cat}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.category && <p className="text-[10px] font-bold text-rose-500 uppercase ml-2">{errors.category.message}</p>}
                                </div>
                                <div className="p-6 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-start gap-4">
                                    <Sparkles className="size-5 text-blue-500 shrink-0 mt-0.5" />
                                    <p className="text-[11px] font-bold text-blue-700 uppercase leading-relaxed tracking-wide">
                                        Sector signals determine node aesthetics across the platform registry.
                                    </p>
                                </div>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="space-y-8 text-center">
                                <div className="space-y-2.5 text-left">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Current Valuation ($)</label>
                                    <div className="relative group">
                                        <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 size-6 text-slate-300 group-focus-within:text-emerald-500 transition-colors stroke-[3]" />
                                        <Input 
                                            type="number"
                                            step="0.01"
                                            {...form.register("price")}
                                            className="h-20 pl-14 rounded-3xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-[12px] focus:ring-emerald-500/5 font-[900] text-4xl tracking-tighter transition-all shadow-inner"
                                        />
                                    </div>
                                    {errors.price && <p className="text-[10px] font-bold text-rose-500 uppercase ml-2">{errors.price.message}</p>}
                                </div>
                                <div className="grid gap-4 text-left">
                                    <div className="rounded-2xl border border-slate-200 bg-white/70 p-5 flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-sm font-[900] text-slate-900 tracking-tight">Require application form</p>
                                            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                                                Gate enrollment behind the course application
                                            </p>
                                        </div>
                                        <Switch
                                            checked={form.watch("requiresForm")}
                                            onCheckedChange={(checked) => {
                                                form.setValue("requiresForm", checked, { shouldDirty: true });
                                                if (!checked) {
                                                    form.setValue("autoApproveApplications", false, { shouldDirty: true });
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="rounded-2xl border border-slate-200 bg-white/70 p-5 flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-sm font-[900] text-slate-900 tracking-tight">Auto-approve applications</p>
                                            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                                                Free courses enroll immediately after a valid submission
                                            </p>
                                        </div>
                                        <Switch
                                            checked={form.watch("autoApproveApplications")}
                                            disabled={!form.watch("requiresForm")}
                                            onCheckedChange={(checked) =>
                                                form.setValue("autoApproveApplications", checked, { shouldDirty: true })
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="p-6 rounded-2xl bg-emerald-50/50 border border-emerald-100/50 inline-flex items-center gap-3">
                                    <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Node Valuation Strategy: Active</p>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    className="h-12 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] text-slate-400 hover:text-slate-900 transition-all disabled:opacity-0"
                >
                    <ChevronLeft className="size-3 mr-2 stroke-[3]" />
                    Back
                </Button>

                <Button 
                    type="button" 
                    onClick={nextStep}
                    disabled={createCourse.isPending}
                    className={cn(
                        "h-12 rounded-xl px-8 font-black uppercase tracking-[0.2em] text-[10px] transition-all active:scale-95 shadow-lg",
                        currentStep === STEPS.length - 1 
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20" 
                            : "bg-slate-900 hover:bg-black text-white shadow-slate-900/20"
                    )}
                >
                    {createCourse.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                    ) : currentStep === STEPS.length - 1 ? (
                        <>
                            <CheckCircle2 className="size-4 mr-2 stroke-[3]" />
                            Deploy Node
                        </>
                    ) : (
                        <>
                            Continue
                            <ChevronRight className="size-3 ml-2 stroke-[3]" />
                        </>
                    )}
                </Button>
            </div>
        </GlassCard>

        <div className="flex justify-center">
             <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">Authorized Deployment Terminal</p>
        </div>
      </div>
    </div>
  );
}
