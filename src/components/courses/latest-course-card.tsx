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
        "bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible flex flex-col h-full",
        className,
      )}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: 0.45,
        ease: [0.25, 0.46, 0.45, 0.94],
        delay: index * 0.1,
      }}
      whileHover={{ y: -6, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.10)" }}
    >
      {/* ── Image block ──────────────────────────────────────── */}
      <div className="relative aspect-[4/3] w-full rounded-t-2xl overflow-hidden shrink-0 group">
        <Image
          src={
            course.thumbnail ||
            "https://images.unsplash.com/photo-1620064916958-605375619af8?q=80&w=800&auto=format&fit=crop"
          }
          alt={course.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        {/* Category badge */}
        {course.category && (
          <motion.span
            className="absolute top-3 left-3 bg-hero-orange text-white text-xs font-semibold rounded px-3 py-1 z-10 shadow-sm"
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 + 0.2, duration: 0.3 }}
          >
            {course.category}
          </motion.span>
        )}

        {/* Wishlist button */}
        <motion.button
          onClick={() => setWishlisted((v) => !v)}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.78 }}
          transition={{ type: "spring", stiffness: 500, damping: 15 }}
        >
          <motion.span
            animate={{ scale: wishlisted ? [1, 1.45, 1] : 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex"
          >
            <Heart
              className={cn(
                "w-4 h-4 transition-colors duration-200",
                wishlisted
                  ? "fill-hero-orange stroke-hero-orange"
                  : "stroke-gray-400 fill-transparent",
              )}
            />
          </motion.span>
        </motion.button>
      </div>

      {/* ── Content ──────────────────────────────────────────── */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Title */}
        <h3 className="font-bold text-sm leading-snug line-clamp-2 text-gray-900">
          {course.title}
        </h3>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {course.lessonsCount !== undefined && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              Lesson : {course.lessonsCount}
            </span>
          )}
          {course.studentsCount !== undefined && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Users className="w-3.5 h-3.5 shrink-0" />
              Student : {course.studentsCount}
            </span>
          )}
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <CircleDollarSign className="w-3.5 h-3.5 shrink-0" />
            {isPaid ? "Paid" : "Free"}
          </span>
        </div>

        {/* Price row */}
        {isPaid && displayPrice !== undefined && (
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-sm text-gray-900">
              {displayPrice} EGP
            </span>
            {showStrikethrough && (
              <span className="text-xs text-gray-400 line-through">
                {originalPrice} EGP
              </span>
            )}
          </div>
        )}

        {/* Enroll row */}
        <div className="flex items-center gap-3 mt-auto">
          <motion.div
            className="flex-1"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <Link
              href={ROUTES.COURSE_DETAIL(course.slug)}
              className="flex w-full items-center justify-center gap-1.5 bg-hero-blue hover:bg-hero-blue-dark text-white text-sm font-medium rounded-full py-2.5 transition-colors"
            >
              Enroll Now
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </motion.div>

          {/* Rating badge */}
          {course.rating !== undefined && (
            <motion.div
              className="w-12 h-12 rounded-full border-2 border-gray-100 shadow-sm bg-white flex flex-col items-center justify-center shrink-0"
              whileHover={{ scale: 1.14, rotate: -8 }}
              transition={{ type: "spring", stiffness: 400, damping: 12 }}
            >
              <span className="text-xs font-bold text-gray-800 leading-none">
                {course.rating.toFixed(1)}
              </span>
              <Star className="w-3 h-3 fill-amber-400 stroke-amber-400 mt-0.5" />
            </motion.div>
          )}
        </div>

        {/* Separator */}
        <hr className="border-gray-100" />

        {/* Instructor row */}
        <div className="flex items-center justify-between gap-2">
          {course.instructor ? (
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="h-7 w-7 shrink-0 ring-1 ring-gray-100">
                <AvatarImage
                  src={course.instructor.avatar}
                  alt={course.instructor.name}
                />
                <AvatarFallback className="text-xs bg-gray-100 text-gray-600 font-medium">
                  {instructorInitials}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-semibold text-gray-700 truncate">
                {course.instructor.name}
              </span>
            </div>
          ) : (
            <span />
          )}

          <Link
            href={ROUTES.COURSE_DETAIL(course.slug)}
            className="text-xs font-medium text-hero-blue hover:underline shrink-0 flex items-center gap-0.5"
          >
            Details <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
