"use client";

import { useState } from "react";
import { Course } from "@/types/course.types";
import { useEnrollIntentController } from "@/lib/enrollment/intent-controller";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";
import {
  motion,
  useScroll,
  useMotionValueEvent,
  AnimatePresence,
} from "framer-motion";

interface CourseStickyCtaProps {
  course: Course;
}

export function CourseStickyCta({ course }: CourseStickyCtaProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { openFromCta } = useEnrollIntentController();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 400 && !isVisible) {
      setIsVisible(true);
    } else if (latest <= 400 && isVisible) {
      setIsVisible(false);
    }
  });

  const isPaid = (course.price ?? 0) > 0;
  const isEnrolled = course.isSubscribed;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{
            y: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 200, damping: 20 },
          }}
          exit={{ y: 100, opacity: 0, transition: { duration: 0.3 } }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 pointer-events-auto"
        >
          <div className="container mx-auto max-w-5xl">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 shadow-2xl rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="hidden sm:block min-w-0 flex-1">
                <h3 className="font-bold text-slate-900 dark:text-white truncate">
                  {course.title}
                </h3>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-500">
                    {course.instructor?.name || "Expert Instructor"}
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {isPaid ? `$${course.currentPrice}` : "Free"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <span className="sm:hidden font-bold text-slate-800 dark:text-slate-200 mr-auto">
                  {isPaid ? `$${course.currentPrice}` : "Free"}
                </span>

                <button className="flex items-center justify-center px-6 py-3 rounded-full font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  Share
                </button>
                {isEnrolled ? (
                  <Link
                    href={ROUTES.LESSON(course.slug, "1")}
                    className="flex-1 sm:flex-none flex items-center justify-center px-8 py-3 rounded-full font-bold text-white bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                  >
                    Resume Learning
                  </Link>
                ) : (
                  <button
                    onClick={() =>
                      openFromCta({
                        course,
                        source: "course_sticky_cta",
                      })
                    }
                    className="flex-1 sm:flex-none flex items-center justify-center px-8 py-3 rounded-full font-bold text-white bg-linear-to-r from-hero-blue to-hero-blue-dark hover:from-[#3db3ec] hover:to-[#2b90ca] shadow-lg shadow-hero-blue/20 transition-all active:scale-95"
                  >
                    Enroll Now
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
