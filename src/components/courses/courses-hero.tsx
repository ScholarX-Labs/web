"use client";

import {
  Search,
  Briefcase,
  TrendingUp,
  DollarSign,
  Laptop,
  Globe,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui.store";

const FILTER_TAGS = [
  { label: "Career Preparation", icon: Briefcase, value: "Career Preparation" },
  { label: "Skill Development", icon: TrendingUp, value: "Skill Development" },
  { label: "Free / Paid", icon: DollarSign, value: "Free / Paid" },
  { label: "Online / In-Person", icon: Laptop, value: "Online / In-Person" },
  {
    label: "International Opportunities",
    icon: Globe,
    value: "International Opportunities",
  },
] as const;

export function CoursesHero() {
  const {
    courseSearch,
    activeCourseFilters,
    setCourseSearch,
    toggleCourseFilter,
  } = useUiStore();

  return (
    <section
      className="relative w-full overflow-hidden py-16 md:py-20"
      style={{ backgroundColor: "#3399CC33" }}
    >
      {/* ── Birds on Branch (top-left) ─────────────────────────────────── */}
      <div className="absolute top-0 left-0 z-10 hidden sm:block pointer-events-none select-none">
        <Image
          src="/courses-hero-birds.svg"
          alt=""
          width={160}
          height={110}
          priority
        />
      </div>

      {/* ── Sparkle / Star decorations ────────────────────────────────── */}
      {/* Top-center star */}
      <div className="absolute top-6 left-1/2 -translate-x-20 z-10 hidden md:block pointer-events-none select-none">
        <Image src="/courses-hero-star.png" alt="" width={28} height={28} />
      </div>
      {/* Right column upper star */}
      <div className="absolute top-10 right-[28%] z-10 hidden lg:block pointer-events-none select-none">
        <Image src="/courses-hero-star.png" alt="" width={22} height={22} />
      </div>
      {/* Right column lower star */}
      <div className="absolute bottom-12 right-[8%] z-10 hidden lg:block pointer-events-none select-none">
        <Image src="/courses-hero-star.png" alt="" width={18} height={18} />
      </div>

      {/* ── Yellow × marks ────────────────────────────────────────────── */}
      <span
        aria-hidden="true"
        className="absolute top-16 right-[42%] text-[#fbbf24] font-bold text-lg hidden md:block pointer-events-none select-none"
      >
        ✕
      </span>
      <span
        aria-hidden="true"
        className="absolute bottom-16 left-[44%] text-[#fbbf24] font-bold text-base hidden lg:block pointer-events-none select-none"
      >
        ✕
      </span>
      <span
        aria-hidden="true"
        className="absolute top-8 right-[15%] text-[#fbbf24] font-bold text-sm hidden lg:block pointer-events-none select-none"
      >
        ✕
      </span>

      {/* ── Main Content ──────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left Column: Text & Search */}
          <div className="flex flex-col max-w-2xl">
            <h1 className="text-5xl lg:text-7xl font-extrabold text-hero-heading leading-[1.1] tracking-tight mb-6">
              Discover
              <br />
              Our Courses
            </h1>

            <p className="text-lg md:text-xl text-hero-body mb-10 font-medium max-w-lg leading-relaxed">
              Scholarships, Mentorship &amp; Skill Development Opportunities
            </p>

            {/* Search Bar */}
            <div className="flex items-center w-full max-w-lg bg-white rounded-full p-2 shadow-sm border border-black/5 transition-shadow hover:shadow-md mb-8">
              <button className="bg-hero-blue text-white px-6 py-3 rounded-full font-medium text-sm transition-colors hover:bg-hero-blue-dark shrink-0">
                Categories
              </button>
              <input
                type="text"
                placeholder="Search anything"
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                className="flex-1 bg-transparent border-none px-5 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0 min-w-0"
              />
              <button
                aria-label="Search"
                className="p-3 text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Pill Tags */}
            <div className="flex flex-wrap gap-3">
              {FILTER_TAGS.map(({ label, icon: Icon, value }) => {
                const isActive = activeCourseFilters.includes(value);
                return (
                  <button
                    key={value}
                    onClick={() => toggleCourseFilter(value)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border text-xs font-semibold shadow-sm transition-all duration-200 hover:-translate-y-0.5 cursor-pointer",
                      isActive
                        ? "bg-hero-blue border-hero-blue text-white"
                        : "bg-[#fdf2ee] border-[#d6aca3] text-[#a85a46]",
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
               Right Column — figures + floating badges
               Layer order (back → front):
                 z-0  : Soft white card (depth backdrop)
                 z-10 : Teacher — blue bg div + thumb-2-1 SVG on top
                 z-20 : Orange circle — child accent
                 z-30 : Child — thumb-2-2 SVG (arch clip built-in)
                 z-40 : Floating stat badges
          ──────────────────────────────────────────────────────────── */}
          <div className="relative h-[500px] w-full hidden lg:block">
            {/* Soft white card backdrop */}
            <div className="absolute left-[14%] right-[10%] top-[5%] bottom-[8%] bg-white/30 rounded-3xl z-0" />

            {/* ── Teacher: wrapper positions blue bg + thumb-2-1 SVG together ── */}
            <div
              className="absolute z-10 transition-transform duration-500 hover:scale-[1.02]"
              style={{ left: "2%", top: "3%" }}
            >
              {/* Blue fill — 8px overflow so it peeks out like the design */}
              <div
                className="absolute bg-hero-blue"
                style={{
                  inset: "-8px",
                  borderRadius: "9999px 20px 9999px 9999px",
                }}
              />
              <Image
                src="/thumb-2-1.4b9d026878e55263d488.png.svg"
                alt="Instructor"
                width={228}
                height={345}
                className="relative drop-shadow-sm"
              />
            </div>

            {/* ── Orange circle — child background accent ── */}
            <div
              className="absolute bg-hero-orange rounded-full z-20"
              style={{
                right: "3%",
                bottom: "2%",
                width: "260px",
                height: "260px",
              }}
            />

            {/* ── Child: thumb-2-2 SVG — arch clip built-in ── */}
            <div
              className="absolute z-30 transition-transform duration-500 hover:scale-[1.02]"
              style={{ right: "3%", bottom: 0 }}
            >
              <Image
                src="/thumb-2-2.ff7e4b702e36c420d1e4.png.svg"
                alt="Student"
                width={270}
                height={314}
                className="drop-shadow-lg"
              />
            </div>

            {/* ── "5.8k Success Courses" floating badge ── */}
            <div className="absolute top-[7%] right-[1%] bg-white shadow-xl rounded-full px-6 py-3 border border-gray-100 flex flex-col justify-center z-40 animate-in slide-in-from-right fade-in duration-700 delay-300">
              <span className="text-[#fca01e] font-extrabold text-xl leading-none">
                5.8k
              </span>
              <span className="text-gray-500 text-xs font-semibold">
                Success Courses
              </span>
            </div>

            {/* ── "10k+ Students" badge: text + SVG avatars in one white pill ── */}
            <div className="absolute bottom-[1%] left-[0%] z-40 animate-in slide-in-from-left fade-in duration-700 delay-500">
              <div className="bg-white shadow-xl rounded-full pl-5 pr-4 py-3 border border-gray-100 flex items-center gap-4">
                <div className="flex flex-col leading-none gap-0.5">
                  <span className="text-hero-blue font-extrabold text-lg leading-none">
                    10k+
                  </span>
                  <span className="text-gray-600 text-sm font-semibold">
                    Student
                  </span>
                </div>
                <Image
                  src="/courses-hero-10k_students.svg"
                  alt="students avatars"
                  width={102}
                  height={30}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
