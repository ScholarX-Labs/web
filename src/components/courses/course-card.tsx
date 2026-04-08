"use client";

import Image from "next/image";
import Link from "next/link";
import { MouseEvent } from "react";
import { Course } from "@/types/course.types";
import { ROUTES } from "@/lib/routes";
import { SpotlightCard } from "@/components/animations/spotlight-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
import { CoursePrice } from "./course-price";
import { CourseRating } from "./course-rating";
import { CourseMeta } from "./course-meta";
import { InstructorInfo } from "./instructor-info";
import { cn } from "@/lib/utils";
import { Monitor, PenTool, Database, Cpu, Tag } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useCourseSheetStore } from "@/stores/course-sheet.store";

const CATEGORY_STYLES: Record<
  string,
  { icon: React.ElementType; gradient: string; shadow: string; ring: string }
> = {
  Engineering: {
    icon: Monitor,
    gradient: "from-blue-500 to-cyan-400",
    shadow: "shadow-[0_4px_14px_rgba(59,130,246,0.4)]",
    ring: "ring-blue-400/30",
  },
  Design: {
    icon: PenTool,
    gradient: "from-pink-500 to-rose-400",
    shadow: "shadow-[0_4px_14px_rgba(236,72,153,0.4)]",
    ring: "ring-pink-400/30",
  },
  Backend: {
    icon: Database,
    gradient: "from-emerald-500 to-teal-400",
    shadow: "shadow-[0_4px_14px_rgba(16,185,129,0.4)]",
    ring: "ring-emerald-400/30",
  },
  Systems: {
    icon: Cpu,
    gradient: "from-purple-500 to-violet-400",
    shadow: "shadow-[0_4px_14px_rgba(168,85,247,0.4)]",
    ring: "ring-purple-400/30",
  },
};

const DEFAULT_CATEGORY_STYLE = {
  icon: Tag,
  gradient: "from-hero-orange to-[#ff8a6a]",
  shadow: "shadow-[0_4px_14px_rgba(255,106,58,0.4)]",
  ring: "ring-white/30",
};

interface CourseCardProps {
  course: Course;
  className?: string;
}

export function CourseCard({ course, className }: CourseCardProps) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const openCourseSheet = useCourseSheetStore((state) => state.openCourseSheet);

  const handleCardClick = (event: MouseEvent<HTMLAnchorElement>) => {
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
    openCourseSheet(
      course,
      "details",
      event.currentTarget.getBoundingClientRect(),
    );
  };

  return (
    <Link
      href={ROUTES.COURSE_DETAIL(course.id)}
      onClick={handleCardClick}
      className="block outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-[1.5rem] h-full"
    >
      <SpotlightCard className="h-full group/spotlight rounded-[1.5rem] bg-card/40 dark:bg-card/20 backdrop-blur-xl border-border/40 hover:border-primary/20 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5">
        <Card
          className={cn(
            "group/course-card flex flex-col w-full h-full overflow-hidden border-transparent bg-transparent shadow-none",
            className,
          )}
        >
          <div
            className="relative aspect-video w-full overflow-hidden mb-2 rounded-t-[1.5rem]"
            style={{ viewTransitionName: `course-thumbnail-${course.slug}` }}
          >
            <Image
              src={
                course.thumbnail ||
                "https://images.unsplash.com/photo-1620064916958-605375619af8?q=80&w=800&auto=format&fit=crop"
              }
              alt={course.title}
              fill
              className="object-cover transition-transform duration-700 ease-out will-change-transform group-hover/course-card:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {/* Elegant gradient overlay */}
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/10 to-transparent opacity-80 transition-opacity duration-500 group-hover/course-card:opacity-95" />

            {course.category &&
              (() => {
                const style =
                  CATEGORY_STYLES[course.category] || DEFAULT_CATEGORY_STYLE;
                const Icon = style.icon;
                return (
                  <div
                    className={cn(
                      "absolute left-4 top-4 px-3 py-1.5 text-xs shadow-sm text-white font-semibold tracking-wide rounded-md ring-1 backdrop-blur-md flex items-center gap-1.5 bg-linear-to-r",
                      style.gradient,
                      style.shadow,
                      style.ring,
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {course.category}
                  </div>
                );
              })()}

            <div className="absolute bottom-4 right-4 shadow-lg transition-transform duration-500 ease-out group-hover/course-card:-translate-y-1">
              <CoursePrice
                price={course.price}
                className="bg-black/60 backdrop-blur-xl px-3 py-1.5 rounded-full text-sm border border-white/10 text-white"
              />
            </div>
          </div>

          {/* Content Area */}
          <CardContent className="flex flex-col flex-1 gap-4 p-6">
            <div className="flex flex-col gap-2.5">
              <CardTitle className="line-clamp-2 text-xl font-bold tracking-tight leading-snug transition-colors group-hover/course-card:text-primary">
                {course.title}
              </CardTitle>
              <CardDescription className="line-clamp-2 text-sm leading-relaxed text-muted-foreground/90 font-medium">
                {course.description}
              </CardDescription>
            </div>
            <CourseMeta
              duration={course.duration}
              level={course.level}
              videosCount={course.videosCount}
              className="mt-auto pt-6 border-t border-border/30"
            />
          </CardContent>

          {/* Footer */}
          <CardFooter className="flex flex-wrap items-center justify-between gap-4 px-6 pb-6 pt-0 mt-auto bg-transparent">
            <InstructorInfo
              instructor={course.instructor}
              className="transition-transform duration-500 hover:scale-105"
            />
            {course.rating !== undefined && (
              <CourseRating
                rating={course.rating}
                totalRatings={course.totalRatings}
                className="opacity-90 group-hover/spotlight:opacity-100 transition-opacity"
              />
            )}
          </CardFooter>
        </Card>
      </SpotlightCard>
    </Link>
  );
}
