"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Course } from "@/types/course.types";
import { LatestCourseCard } from "./latest-course-card";
import { cn } from "@/lib/utils";
import { CourseDetailSurfacePortal } from "./course-detail-surface-portal";

interface LatestCoursesSectionProps {
  courses: Course[];
}

export function LatestCoursesSection({ courses }: LatestCoursesSectionProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: "start",
    dragFree: false,
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);
  const [activeCardIndex, setActiveCardIndex] = useState<number | null>(null);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    // Defer the initial setting to avoid synchronous setState warning
    Promise.resolve().then(onSelect);

    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <section
      data-catalog-grid
      className="px-4 md:px-8 lg:px-16 py-16 bg-white transition-[opacity,filter] duration-300 ease-out data-[dimmed=true]:opacity-40 data-[dimmed=true]:blur-[10px] data-[dimmed=true]:pointer-events-none"
    >
      {/* ── Section header ─────────────────────────────────────── */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <motion.p
            className="text-hero-blue text-sm font-semibold mb-1 tracking-wide"
            initial={{ opacity: 0, x: -14 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            Our Courses
          </motion.p>
          <motion.h2
            className="text-4xl font-extrabold leading-tight text-gray-900"
            initial={{ opacity: 0, x: -14 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            Latest <span className="text-hero-blue">Courses</span>
          </motion.h2>
        </div>
        <motion.div
          initial={{ opacity: 0, x: 14 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Link
            href="/courses"
            className="text-hero-blue text-sm font-medium hover:underline underline-offset-2"
          >
            See more →
          </Link>
        </motion.div>
      </div>

      {/* ── Embla carousel ─────────────────────────────────────── */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-6">
          {courses.map((course, index) => (
            <div
              key={course.id}
              className={cn(
                "flex-[0_0_100%] sm:flex-[0_0_calc(50%-12px)] lg:flex-[0_0_calc(33.333%-16px)] min-w-0 transition-[opacity,transform,filter] duration-300 ease-out motion-reduce:transition-opacity motion-reduce:duration-200 motion-reduce:transform-none motion-reduce:filter-none",
                activeCardIndex !== null && activeCardIndex !== index
                  ? "opacity-65 scale-[0.985]"
                  : "opacity-100 scale-100",
              )}
              onMouseEnter={() => setActiveCardIndex(index)}
              onMouseLeave={() => setActiveCardIndex(null)}
              onFocusCapture={() => setActiveCardIndex(index)}
              onBlurCapture={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  setActiveCardIndex(null);
                }
              }}
            >
              <LatestCourseCard course={course} index={index} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Navigation arrows ──────────────────────────────────── */}
      <motion.div
        className="flex justify-center items-center gap-4 mt-10"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <motion.button
          onClick={scrollPrev}
          disabled={!canScrollPrev}
          aria-label="Previous courses"
          className={cn(
            "w-10 h-10 rounded-full border-2 border-hero-blue text-hero-blue flex items-center justify-center",
            !canScrollPrev && "opacity-40 pointer-events-none",
          )}
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.88 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
        >
          <ChevronLeft className="w-5 h-5" />
        </motion.button>
        <motion.button
          onClick={scrollNext}
          disabled={!canScrollNext}
          aria-label="Next courses"
          className={cn(
            "w-10 h-10 rounded-full bg-hero-blue text-white flex items-center justify-center",
            !canScrollNext && "opacity-40 pointer-events-none",
          )}
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.88 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
        >
          <ChevronRight className="w-5 h-5" />
        </motion.button>
      </motion.div>

      <CourseDetailSurfacePortal />
    </section>
  );
}
