"use client";

import { Instructor } from "@/types/course.types";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Star, PlayCircle, Users } from "lucide-react";

interface CourseInstructorProps {
  instructor?: Instructor;
}

export function CourseInstructor({ instructor }: CourseInstructorProps) {
  if (!instructor) return null;

  const initials = instructor.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
        Your Instructor
      </h2>

      <div className="flex flex-col md:flex-row gap-6 p-6 md:p-8 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl transition-all">
        <div className="shrink-0 flex flex-col items-center md:items-start gap-4">
          <Avatar className="w-24 h-24 sm:w-32 sm:h-32 ring-4 ring-white shadow-xl">
            {instructor.avatar && (
              <AvatarImage src={instructor.avatar} alt={instructor.name} className="object-cover" />
            )}
            <AvatarFallback className="bg-slate-200 text-slate-700 text-3xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="font-medium text-slate-900 dark:text-white">4.8 Instructor Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>45,213 Students</span>
            </div>
            <div className="flex items-center gap-2">
              <PlayCircle className="w-4 h-4" />
              <span>12 Courses</span>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-4 text-center md:text-left">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white text-balance">{instructor.name}</h3>
            <p className="text-hero-blue font-medium">{instructor.title || "Senior Instructor"}</p>
          </div>
          
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-balance">
            Passionate educator with over 15 years of industry experience. 
            I&apos;ve helped thousands of students transition into tech careers through clear, concise, and practical teaching methods.
            My courses focus on real-world applications and building portfolios that get you hired.
          </p>
        </div>
      </div>
    </section>
  );
}
