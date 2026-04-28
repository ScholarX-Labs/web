"use client";

import { Course } from "@/types/course.types";
import { CheckCircle2 } from "lucide-react";
import { StaggerContainer, StaggerItem } from "@/components/animations/stagger";

interface CourseCurriculumProps {
  course: Course;
}

export function CourseCurriculum({ course }: CourseCurriculumProps) {
  // In a real application, the course curriculum might come from course.lessons
  // For this UI mockup, we will provide a stylized static what-you-learn list
  // since the course type doesn't have deep curriculum data yet.

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
        What you&apos;ll learn
      </h2>

      <StaggerContainer className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8">
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            "Master the fundamentals from zero to hero",
            "Build real-world projects you can show off",
            "Understand the underlying architecture",
            "Best practices and standard patterns",
            "Performance optimization techniques",
            "Deploying your applications to production",
          ].map((item, i) => (
            <StaggerItem key={i} as="li" className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500 mt-0.5" />
              <span className="text-slate-700 dark:text-slate-300 leading-tight">
                {item}
              </span>
            </StaggerItem>
          ))}
        </ul>
      </StaggerContainer>

      <div className="pt-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
          Curriculum
        </h2>
        {/* Placeholder for actual accordion curriculum */}
        <StaggerContainer className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          {[1, 2, 3, 4, 5].map((section, i) => (
            <StaggerItem
              key={i}
              className="border-b border-slate-200 dark:border-slate-800 last:border-0 bg-white dark:bg-card p-6 flex flex-col md:flex-row gap-4 justify-between md:items-center hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer"
            >
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Module {section}: Core Concepts
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  4 lessons • 45m total
                </p>
              </div>
              <div className="text-sm font-medium text-hero-blue">Preview</div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
