"use client";

import { useEffect } from "react";
import { Course } from "@/types/course.types";
import { motion } from "framer-motion";
import { GraduationCap, ArrowRight, BookOpen } from "lucide-react";
import confetti from "canvas-confetti";
import { useRouter } from "next/navigation";

interface EnrollmentSuccessProps {
  course: Course;
  onClose: () => void;
}

export function EnrollmentSuccess({ course, onClose }: EnrollmentSuccessProps) {
  useEffect(() => {
    // Fire confetti burst upon mounting
    const end = Date.now() + 1.5 * 1000;
    const colors = ["#3399cc", "#ff6a3a", "#ffffff"];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-8 text-center space-y-6">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="w-24 h-24 rounded-full bg-linear-to-br from-hero-blue to-hero-blue-dark flex items-center justify-center shadow-2xl shadow-hero-blue/30 ring-8 ring-hero-blue/10"
      >
        <GraduationCap className="w-12 h-12 text-white ml-2" />
      </motion.div>

      <div className="space-y-2">
        <motion.h2 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="text-3xl font-extrabold text-slate-900 dark:text-white"
        >
          You&apos;re enrolled!
        </motion.h2>
        <motion.p 
           initial={{ y: 20, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           transition={{ delay: 0.25 }}
           className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto"
        >
          Your learning journey in <span className="font-bold text-slate-900 dark:text-slate-200">{course.title}</span> begins now.
        </motion.p>
      </div>

      <motion.div 
         initial={{ y: 20, opacity: 0 }}
         animate={{ y: 0, opacity: 1 }}
         transition={{ delay: 0.35 }}
         className="w-full flex flex-col gap-3 pt-6"
      >
        <button 
          onClick={() => {
            onClose();
            // In a real app we'd navigate to the lesson player:
            // router.push(ROUTES.LESSON(course.slug, "start"));
          }}
          className="w-full flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-bold rounded-xl py-4 transition-colors group"
        >
          <BookOpen className="w-4 h-4" />
          Start Learning Now
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
        
        <button 
          onClick={onClose}
          className="w-full flex items-center justify-center font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-xl py-4 transition-colors"
        >
          Explore More Courses
        </button>
      </motion.div>
    </div>
  );
}
