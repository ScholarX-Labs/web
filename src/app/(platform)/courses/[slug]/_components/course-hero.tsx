"use client";

import Image from "next/image";
import { Course } from "@/types/course.types";
import { Badge } from "@/components/ui/badge";
import { Play, Star, Users, Clock, MonitorPlay } from "lucide-react";
import { useScroll, useTransform, motion } from "framer-motion";
import { useEnrollIntentController } from "@/lib/enrollment/intent-controller";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";
import { StaggerContainer, StaggerItem } from "@/components/animations/stagger";

interface CourseHeroProps {
  course: Course;
}

export function CourseHero({ course }: CourseHeroProps) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0.3]);
  const { openFromCta } = useEnrollIntentController();

  const isPaid = (course.price ?? 0) > 0;
  const isEnrolled = course.isSubscribed;

  return (
    <div className="relative w-full overflow-hidden bg-slate-900 text-white pb-16 pt-24 md:pt-32 px-4 md:px-8 border-b border-border/10">
      {/* Decorative Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-linear-to-b from-transparent to-slate-900/90 z-10" />
        <div className="absolute inset-0 bg-slate-900/40 z-10 mix-blend-multiply" />

        {/* Parallax Image Background */}
        <motion.div
          style={{ y, opacity }}
          className="relative w-full h-[120%] -top-[10%]"
        >
          <Image
            src={
              course.thumbnail ||
              "https://images.unsplash.com/photo-1620064916958-605375619af8"
            }
            alt={course.title}
            fill
            className="object-cover blur-2xl opacity-40 scale-110"
            priority
          />
        </motion.div>
      </div>

      <div className="container relative z-20 mx-auto max-w-5xl flex flex-col md:flex-row gap-8 lg:gap-16 items-center">
        {/* Left: Video / Thumbnail */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full md:w-[45%] shrink-0"
        >
          <div
            className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/20 group cursor-pointer"
            style={{ viewTransitionName: `course-thumbnail-${course.slug}` }}
            onClick={() => {
              /* If video URL exists, open video modal */
            }}
          >
            <Image
              src={
                course.thumbnail ||
                "https://images.unsplash.com/photo-1620064916958-605375619af8"
              }
              alt={course.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              priority
            />
            {course.videoPreviewUrl && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/30 transition-colors">
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white ring-1 ring-white/50 group-hover:scale-110 transition-transform">
                  <Play className="w-6 h-6 fill-white ml-1" />
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Right: Info */}
        <StaggerContainer className="w-full md:w-[55%] flex flex-col gap-5">
          <StaggerItem className="flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className="bg-white/10 text-white hover:bg-white/20 ring-1 ring-white/20"
            >
              {course.category || "General"}
            </Badge>
            {course.level && (
              <Badge variant="outline" className="border-white/20 text-white">
                {course.level}
              </Badge>
            )}
          </StaggerItem>

          <StaggerItem
            as="h1"
            className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-white drop-shadow-sm leading-tight text-balance"
          >
            {course.title}
          </StaggerItem>

          <StaggerItem
            as="p"
            className="text-lg text-slate-300 leading-relaxed md:line-clamp-3 text-balance"
          >
            {course.description}
          </StaggerItem>

          {/* Stats Bar */}
          <StaggerItem className="flex flex-wrap items-center gap-x-6 gap-y-3 py-2 text-sm font-medium text-slate-300">
            {course.rating !== undefined && (
              <div className="flex items-center gap-1.5 text-amber-400">
                <Star className="w-4 h-4 fill-amber-400" />
                <span className="text-white">{course.rating.toFixed(1)}</span>
                <span className="text-slate-400">
                  ({course.totalRatings || 0} reviews)
                </span>
              </div>
            )}

            {course.studentsCount !== undefined && (
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-400" />
                <span>{course.studentsCount.toLocaleString()} enrolled</span>
              </div>
            )}

            {course.duration && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>{course.duration}</span>
              </div>
            )}

            {course.lessonsCount && (
              <div className="flex items-center gap-1.5">
                <MonitorPlay className="w-4 h-4 text-slate-400" />
                <span>{course.lessonsCount} lessons</span>
              </div>
            )}
          </StaggerItem>

          {/* Primary CTA */}
          <StaggerItem className="flex flex-col sm:flex-row gap-4 pt-4 relative">
            {/* Note: In a real app we'd attach a ref here to track intersection for sticky bar */}
            {isEnrolled ? (
              <Link
                href={ROUTES.LESSON(course.slug, "lesson-1")}
                className="group relative flex items-center justify-center gap-2 bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white text-base font-bold rounded-full py-4 px-8 shadow-xl shadow-emerald-500/20 transition-all active:scale-[0.98] w-fit overflow-hidden"
              >
                <span className="absolute inset-0 w-full h-full bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                <span className="relative z-10 flex items-center gap-2">
                  Resume Learning
                </span>
              </Link>
            ) : (
              <button
                onClick={() =>
                  openFromCta({
                    course,
                    source: "course_hero",
                  })
                }
                className="group relative flex items-center justify-center gap-2 bg-linear-to-r from-hero-blue to-hero-blue-dark hover:from-[#3db3ec] hover:to-[#2b90ca] text-white text-base font-bold rounded-full py-4 px-8 shadow-xl shadow-hero-blue/20 transition-all active:scale-[0.98] w-fit overflow-hidden"
              >
                <span className="absolute inset-0 w-full h-full bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                <span className="relative z-10 flex items-center gap-2">
                  {isPaid
                    ? `Enroll Now for $${course.currentPrice}`
                    : "Enroll for Free"}
                </span>
              </button>
            )}

            {!isEnrolled && (
              <button className="flex items-center justify-center px-8 py-4 rounded-full font-bold text-white bg-white/5 hover:bg-white/10 ring-1 ring-white/20 transition-colors">
                Add to Wishlist
              </button>
            )}
          </StaggerItem>
        </StaggerContainer>
      </div>
    </div>
  );
}
