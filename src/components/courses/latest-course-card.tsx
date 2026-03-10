"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Heart,
  BookOpen,
  Users,
  CircleDollarSign,
  Star,
  ChevronRight,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Course } from "@/types/course.types";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

interface LatestCourseCardProps {
  course: Course;
  className?: string;
  index?: number;
}

export function LatestCourseCard({
  course,
  className,
  index = 0,
}: LatestCourseCardProps) {
  const [wishlisted, setWishlisted] = useState(false);

  const isPaid = (course.price ?? 0) > 0;
  const displayPrice = course.currentPrice ?? course.price;
  const originalPrice =
    course.originalPrice ??
    (course.currentPrice !== undefined ? course.price : undefined);
  const showStrikethrough =
    originalPrice !== undefined && originalPrice !== displayPrice;

  const instructorInitials = course.instructor?.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <motion.div
      className={cn(
        "group relative bg-white rounded-[1.5rem] shadow-[0_2px_15px_rgba(0,0,0,0.06)] border border-gray-100/80 hover:border-hero-blue/20 overflow-visible flex flex-col h-full",
        className,
      )}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94],
        delay: index * 0.1,
      }}
      whileHover={{
        y: -6,
        scale: 1.01,
        boxShadow: "0 25px 50px -12px rgba(51, 153, 204, 0.20)",
      }}
    >
      {/* Subtle hover background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-hero-blue/[0.04] via-transparent to-hero-orange/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[1.5rem] pointer-events-none z-0" />

      {/* ── Image block ──────────────────────────────────────── */}
      <div className="relative aspect-[4/3] w-full rounded-t-[1.5rem] overflow-hidden shrink-0 z-10 group/image">
        <Image
          src={
            course.thumbnail ||
            "https://images.unsplash.com/photo-1620064916958-605375619af8?q=80&w=800&auto=format&fit=crop"
          }
          alt={course.title}
          fill
          className="object-cover transition-transform duration-700 ease-out group-hover/image:scale-110"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {/* Subtle cinematic gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity duration-500 pointer-events-none z-10" />

        {/* Category badge */}
        {course.category && (
          <motion.span
            className="absolute top-3 left-3 bg-gradient-to-r from-hero-orange to-[#ff8a6a] text-white text-xs font-bold tracking-wide rounded-md px-3 py-1.5 z-20 shadow-[0_4px_14px_rgba(255,106,58,0.4)] ring-1 ring-white/30 backdrop-blur-md"
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 + 0.2, duration: 0.4 }}
          >
            {course.category}
          </motion.span>
        )}

        {/* Wishlist button */}
        <motion.button
          onClick={(e) => {
            e.preventDefault();
            setWishlisted((v) => !v);
          }}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-white/95 backdrop-blur-sm shadow-md border border-white/40 flex items-center justify-center transition-all group-hover/image:bg-white"
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.8 }}
          transition={{ type: "spring", stiffness: 500, damping: 15 }}
        >
          <motion.span
            animate={{ scale: wishlisted ? [1, 1.45, 1] : 1 }}
            transition={{
              duration: 0.35,
              type: "tween",
              ease: [0.34, 1.56, 0.64, 1],
            }}
            className="flex"
          >
            <Heart
              className={cn(
                "w-4 h-4 transition-colors duration-300",
                wishlisted
                  ? "fill-[#ff6a3a] stroke-[#ff6a3a]"
                  : "stroke-gray-600 fill-transparent group-hover/image:stroke-hero-blue",
              )}
            />
          </motion.span>
        </motion.button>
      </div>

      {/* ── Content ──────────────────────────────────────────── */}
      <div className="p-4 sm:p-5 flex flex-col gap-4 flex-1 relative z-10 pb-5">
        {/* Title */}
        <h3 className="font-extrabold text-[15px] sm:text-base leading-snug line-clamp-2 text-slate-800 transition-colors duration-300 group-hover:text-hero-blue drop-shadow-sm">
          {course.title}
        </h3>

        {/* Meta row - Colorful Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {course.lessonsCount !== undefined && (
            <div className="flex items-center gap-1.5 bg-blue-50/80 text-blue-700 px-2.5 py-1 rounded-md text-[11px] font-bold border border-blue-100/50">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{course.lessonsCount} lessons</span>
            </div>
          )}
          {course.studentsCount !== undefined && (
            <div className="flex items-center gap-1.5 bg-orange-50/80 text-orange-700 px-2.5 py-1 rounded-md text-[11px] font-bold border border-orange-100/50">
              <Users className="w-3.5 h-3.5" />
              <span>{course.studentsCount} students</span>
            </div>
          )}
          <div
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border",
              isPaid
                ? "bg-emerald-50/80 text-emerald-700 border-emerald-100/50"
                : "bg-purple-50/80 text-purple-700 border-purple-100/50",
            )}
          >
            <CircleDollarSign className="w-3.5 h-3.5" />
            <span>{isPaid ? "Paid" : "Free"}</span>
          </div>
        </div>

        {/* Price row */}
        <div className="flex items-center gap-2.5 pt-1">
          {displayPrice !== undefined && (
            <>
              {showStrikethrough && originalPrice && (
                <span className="text-xs font-semibold text-slate-500 line-through decoration-slate-500 decoration-2">
                  EGP {originalPrice.toLocaleString()}
                </span>
              )}

              {isPaid ? (
                <span className="font-black text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-hero-blue to-[#4834d4]">
                  EGP {displayPrice.toLocaleString()}
                </span>
              ) : (
                <span className="font-black text-xl tracking-tight text-emerald-600 drop-shadow-sm">
                  Free
                </span>
              )}

              {showStrikethrough && originalPrice !== undefined && (
                <span
                  className={cn(
                    "text-[10px] font-extrabold rounded-full px-2 py-0.5 leading-none shadow-sm",
                    !isPaid
                      ? "text-red-700 bg-red-100 border border-red-300 animate-pulse" // 100% OFF vibrant style
                      : "text-emerald-700 bg-emerald-100 border border-emerald-300"
                  )}
                >
                  {Math.round(
                    ((originalPrice - displayPrice) / originalPrice) * 100,
                  )}
                  % OFF
                </span>
              )}
            </>
          )}
        </div>

        {/* Enroll row */}
        <div className="flex items-center gap-3 mt-auto pt-2">
          <Link
            href={ROUTES.COURSE_DETAIL(course.slug)}
            className="group/btn relative flex-1 overflow-hidden flex items-center justify-center gap-2 bg-gradient-to-r from-hero-blue to-hero-blue-dark text-white text-sm font-bold rounded-full py-3 shadow-lg shadow-hero-blue/30 transition-transform active:scale-[0.98]"
          >
            {/* Shimmer sweep effect inside button */}
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-in-out" />
            <span className="relative z-10 flex items-center gap-1.5">
              Enroll Now
              <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
            </span>
          </Link>

          {/* Rating badge */}
          {course.rating !== undefined && (
            <motion.div
              className="w-[3.25rem] h-[3.25rem] rounded-full border border-amber-200/60 shadow-lg shadow-amber-500/20 bg-gradient-to-br from-amber-50 to-orange-50 flex flex-col items-center justify-center shrink-0 relative overflow-hidden"
              whileHover={{ scale: 1.15, rotate: -8 }}
              transition={{ type: "spring", stiffness: 400, damping: 12 }}
            >
              {/* Subtle top shine on badge layout */}
              <span className="absolute top-0 left-0 w-full h-1/2 bg-white/40 rounded-b-full opacity-60" />
              <span className="text-[13px] font-black text-amber-600 leading-none relative z-10 pt-0.5">
                {course.rating.toFixed(1)}
              </span>
              <Star className="w-3.5 h-3.5 fill-amber-500 stroke-amber-500 mt-0.5 relative z-10" />
            </motion.div>
          )}
        </div>

        {/* Separator */}
        <hr className="border-slate-100 group-hover:border-hero-blue/10 transition-colors duration-300" />

        {/* Instructor row */}
        <div className="flex items-center justify-between gap-3 relative">
          {course.instructor ? (
            <div className="flex items-center gap-2.5 min-w-0 group/instructor cursor-default">
              <Avatar className="h-8 w-8 shrink-0 ring-2 ring-slate-100 group-hover/instructor:ring-hero-blue/30 transition-all duration-300 shadow-sm">
                <AvatarImage
                  src={course.instructor.avatar}
                  alt={course.instructor.name}
                  className="object-cover group-hover/instructor:scale-110 transition-transform duration-500"
                />
                <AvatarFallback className="text-xs bg-slate-100 text-slate-600 font-bold">
                  {instructorInitials}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-bold text-slate-700 truncate group-hover/instructor:text-hero-blue transition-colors">
                {course.instructor.name}
              </span>
            </div>
          ) : (
            <span />
          )}

          <Link
            href={ROUTES.COURSE_DETAIL(course.slug)}
            className="text-xs font-bold text-hero-blue hover:text-hero-blue-dark shrink-0 flex items-center gap-1 group/link transition-colors"
          >
            Details
            <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-1" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
