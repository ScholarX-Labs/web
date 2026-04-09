"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Course } from "@/types/course.types";

interface EnrollModalTitleMediaProps {
  course: Course;
  shouldReduceMotion: boolean;
}

export function EnrollModalTitleMedia({
  course,
  shouldReduceMotion,
}: EnrollModalTitleMediaProps) {
  return (
    <div className="border-b border-slate-100 bg-slate-50/95 p-6 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/65">
      <DialogHeader>
        <DialogTitle className="sr-only">Enroll in {course.title}</DialogTitle>
      </DialogHeader>

      <motion.div
        aria-hidden
        className="mb-4 h-0.75 origin-left rounded-full bg-linear-to-r from-cyan-400 via-hero-blue to-orange-400"
        initial={{ scaleX: 0, opacity: 0.65 }}
        animate={
          shouldReduceMotion
            ? { scaleX: 1, opacity: 0.85 }
            : { scaleX: [0, 1], opacity: [0.65, 1, 0.8] }
        }
        transition={
          shouldReduceMotion
            ? { duration: 0.2 }
            : { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
        }
      />

      <div className="flex gap-4">
        <motion.div
          className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl shadow-md"
          initial={{ scale: 0.92, rotate: -2, opacity: 0.8 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{
            duration: 0.42,
            ease: [0.32, 0.72, 0, 1],
          }}
        >
          <Image
            src={
              course.thumbnail ||
              "https://images.unsplash.com/photo-1620064916958-605375619af8"
            }
            alt={course.title}
            fill
            className="object-cover"
          />
        </motion.div>

        <div className="flex min-w-0 flex-col justify-center">
          <h3 className="line-clamp-2 font-bold leading-tight text-slate-900 dark:text-white">
            {course.title}
          </h3>
          <p className="mt-1 truncate text-sm text-slate-500">
            By {course.instructor?.name || "Expert Instructor"}
          </p>
        </div>
      </div>
    </div>
  );
}
