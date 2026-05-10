"use client";

import { Course } from "@/types/course.types";
import { CheckCircle2, PlayCircle, Lock, Clock } from "lucide-react";
import { StaggerContainer, StaggerItem } from "@/components/animations/stagger";

interface CourseCurriculumProps {
  course: Course;
}

export function CourseCurriculum({ course }: CourseCurriculumProps) {
  const lessons = course.lessons ?? [];

  return (
    <section className="space-y-12">
      <div className="space-y-6">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          What you&apos;ll learn
        </h2>

        <StaggerContainer className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 md:p-10 shadow-sm">
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              "Master the fundamentals from zero to hero",
              "Build real-world projects you can show off",
              "Understand the underlying architecture",
              "Best practices and standard patterns",
              "Performance optimization techniques",
              "Deploying your applications to production",
            ].map((item, i) => (
              <StaggerItem key={i} as="li" className="flex gap-4 items-start">
                <div className="size-6 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                  {item}
                </span>
              </StaggerItem>
            ))}
          </ul>
        </StaggerContainer>
      </div>

      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Curriculum
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-bold mt-1 uppercase tracking-widest">
              {lessons.length} Lessons • Full Access
            </p>
          </div>
        </div>

        <StaggerContainer className="border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl shadow-slate-100 dark:shadow-none">
          {lessons.length === 0 ? (
            <div className="p-16 text-center bg-white dark:bg-card">
              <div className="size-16 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                <PlayCircle className="size-8 text-slate-200" />
              </div>
              <p className="text-slate-500 font-bold">Curriculum is being finalized.</p>
            </div>
          ) : (
            lessons.map((lesson, i) => (
              <StaggerItem
                key={lesson.id}
                className="border-b border-slate-100 dark:border-slate-800 last:border-0 bg-white dark:bg-card p-6 md:p-8 flex flex-col md:flex-row gap-6 justify-between md:items-center hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-5 min-w-0">
                  <div className="size-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10 transition-colors">
                    <span className="text-xs font-black text-slate-400 dark:text-slate-500 group-hover:text-blue-600 transition-colors">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="space-y-1 min-w-0">
                    <h3 className="font-black text-slate-900 dark:text-white truncate text-lg tracking-tight group-hover:text-blue-600 transition-colors">
                      {lesson.title}
                    </h3>
                    <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {lesson.duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {lesson.duration} min
                        </span>
                      )}
                      <span className="size-1 rounded-full bg-slate-200" />
                      <span>Video Lesson</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {course.isSubscribed ? (
                    <div className="size-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                      <PlayCircle className="size-6" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400">
                      <Lock className="size-3.5" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Locked</span>
                    </div>
                  )}
                </div>
              </StaggerItem>
            ))
          )}
        </StaggerContainer>
      </div>
    </section>
  );
}
