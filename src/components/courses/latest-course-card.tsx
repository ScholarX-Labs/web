"use client";

import { MouseEvent, useState } from "react";
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
import { Parallax3DWrapper } from "@/components/animations/parallax-3d-card";
import { VisualLevelMeter } from "./card-parts/visual-level-meter";
import { HoverMedia } from "./card-parts/hover-media";
import { CourseCategoryBadge } from "./card-parts/course-badges";
import { SocialProofRibbon } from "./card-parts/social-proof-ribbon";
import { CoursePriceDisplay } from "./card-parts/course-price-display";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useCourseSheetStore } from "@/stores/course-sheet.store";
import { useEnrollIntentController } from "@/lib/enrollment/intent-controller";

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
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const openCourseSheet = useCourseSheetStore((state) => state.openCourseSheet);
  const { openFromCard } = useEnrollIntentController();
  const courseDetailHref = ROUTES.COURSE_DETAIL(course.slug ?? course.id);

  const isPaid = (course.price ?? 0) > 0;

  const handleSurfaceLinkClick = (
    event: MouseEvent<HTMLAnchorElement>,
    intent: "details" | "enroll",
  ) => {
    if (!isDesktop) return;

    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const cardElement = event.currentTarget.closest(
      "[data-course-card]",
    ) as HTMLElement | null;
    const gridElement = event.currentTarget.closest(
      "[data-catalog-grid]",
    ) as HTMLElement | null;

    if (cardElement) {
      cardElement.setAttribute("data-active-card", "true");
      cardElement.style.transition = "opacity 160ms ease-out";
      cardElement.style.opacity = "0.3";
    }

    if (gridElement) {
      gridElement.setAttribute("data-active-grid", "true");
      gridElement.style.contain = "layout";
      gridElement.style.pointerEvents = "none";
    }

    const originRect = event.currentTarget.getBoundingClientRect();

    if (intent === "enroll") {
      openFromCard({
        course,
        source: "latest_course_card",
        originRect,
      });
      return;
    }

    openCourseSheet(course, intent, originRect);
  };

  const instructorInitials =
    course.instructor?.name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((n) => n[0] ?? "")
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "";

  return (
    <motion.div
      data-course-card
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94],
        delay: index * 0.1,
      }}
      className="h-full"
    >
      <Parallax3DWrapper
        className={cn(
          "group relative bg-white rounded-[1.5rem] shadow-[0_2px_15px_rgba(0,0,0,0.06)] border border-gray-100/80 hover:border-hero-blue/20 flex flex-col h-full overflow-hidden",
          className,
        )}
      >
        {/* Subtle hover background glow */}
        <div className="absolute inset-0 bg-linear-to-br from-hero-blue/4 via-transparent to-hero-orange/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[1.5rem] pointer-events-none z-0" />

        <div
          className="relative aspect-4/3 w-full rounded-t-[1.5rem] overflow-hidden shrink-0 z-10 group/image"
          style={{ viewTransitionName: `course-thumbnail-${course.slug}` }}
        >
          <HoverMedia
            thumbnail={course.thumbnail}
            title={course.title}
            videoPreviewUrl={course.videoPreviewUrl}
          />

          <SocialProofRibbon
            isBestseller={course.isBestseller}
            urgencyText={course.urgencyText}
          />

          <CourseCategoryBadge
            category={course.category}
            delay={index * 0.1 + 0.2}
            className="absolute top-3 left-3 z-20"
          />

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
                    ? "fill-hero-orange stroke-hero-orange"
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
            {course.level && (
              <div className="flex items-center gap-1.5 bg-slate-50/80 text-slate-700 px-2.5 py-1 rounded-md text-[11px] font-bold border border-slate-200/50">
                <VisualLevelMeter level={course.level} />
              </div>
            )}
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
          <CoursePriceDisplay
            price={course.price}
            currentPrice={course.currentPrice}
            originalPrice={course.originalPrice}
          />

          {/* Tech Stack Tags */}
          {course.tags && course.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-auto pt-1 pb-1">
              {course.tags.slice(0, 3).map((tag, i) => (
                <span
                  key={i}
                  className="text-[10px] font-semibold tracking-wider text-slate-500 bg-slate-100/80 border border-slate-200/60 rounded-md px-2 py-0.5"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Enroll row */}
          <div className="flex items-center gap-3 mt-auto pt-2">
            {course.isSubscribed ? (
              <Link
                href={courseDetailHref}
                onClick={(event) => handleSurfaceLinkClick(event, "details")}
                className="group/btn relative flex-1 overflow-hidden flex items-center justify-center gap-2 bg-linear-to-r from-emerald-500 to-emerald-600 text-white text-sm font-bold rounded-full py-3 shadow-lg shadow-emerald-500/30 transition-transform active:scale-[0.98]"
              >
                <span className="absolute inset-0 w-full h-full bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-in-out" />
                <span className="relative z-10 flex items-center gap-1.5">
                  Resume Learning
                  <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                </span>
              </Link>
            ) : (
              <Link
                href={`${courseDetailHref}?intent=enroll`}
                onClick={(event) => handleSurfaceLinkClick(event, "enroll")}
                className="group/btn relative flex-1 overflow-hidden flex items-center justify-center gap-2 bg-linear-to-r from-hero-blue to-hero-blue-dark text-white text-sm font-bold rounded-full py-3 shadow-lg shadow-hero-blue/30 transition-transform active:scale-[0.98]"
              >
                <span className="absolute inset-0 w-full h-full bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-in-out" />
                <span className="relative z-10 flex items-center gap-1.5">
                  Enroll Now
                  <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                </span>
              </Link>
            )}

            {/* Rating badge */}
            {course.rating !== undefined && (
              <motion.div
                className="w-13 h-13 rounded-full border border-amber-200/60 shadow-lg shadow-amber-500/20 bg-linear-to-br from-amber-50 to-orange-50 flex flex-col items-center justify-center shrink-0 relative overflow-hidden"
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
              href={courseDetailHref}
              onClick={(event) => handleSurfaceLinkClick(event, "details")}
              className="text-xs font-bold text-hero-blue hover:text-hero-blue-dark shrink-0 flex items-center gap-1 group/link transition-colors"
            >
              Details
              <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-1" />
            </Link>
          </div>
        </div>
      </Parallax3DWrapper>
    </motion.div>
  );
}
