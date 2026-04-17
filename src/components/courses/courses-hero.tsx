"use client";

import {
  Search,
  Briefcase,
  TrendingUp,
  DollarSign,
  Laptop,
  Globe,
  ChevronDown,
  Monitor,
  PenTool,
  Database,
  Cpu,
} from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui.store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

const COURSE_CATEGORIES = [
  { label: "Engineering", icon: Monitor, colorClass: "text-blue-500", hoverBg: "hover:bg-blue-500 focus:bg-blue-500 dark:hover:bg-blue-500 dark:focus:bg-blue-500" },
  { label: "Design", icon: PenTool, colorClass: "text-pink-500", hoverBg: "hover:bg-pink-500 focus:bg-pink-500 dark:hover:bg-pink-500 dark:focus:bg-pink-500" },
  { label: "Backend", icon: Database, colorClass: "text-emerald-500", hoverBg: "hover:bg-emerald-500 focus:bg-emerald-500 dark:hover:bg-emerald-500 dark:focus:bg-emerald-500" },
  { label: "Systems", icon: Cpu, colorClass: "text-purple-500", hoverBg: "hover:bg-purple-500 focus:bg-purple-500 dark:hover:bg-purple-500 dark:focus:bg-purple-500" },
] as const;

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 15 },
  },
};

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
          style={{ width: "160px", height: "auto" }}
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
          <motion.div 
            className="flex flex-col max-w-2xl"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            <motion.h1 
              variants={itemVariants}
              className="text-5xl lg:text-7xl font-extrabold text-hero-heading leading-[1.1] tracking-tight mb-6"
            >
              Discover
              <br />
              Our Courses
            </motion.h1>

            <motion.p 
              variants={itemVariants}
              className="text-lg md:text-xl text-hero-body mb-10 font-medium max-w-lg leading-relaxed"
            >
              Scholarships, Mentorship &amp; Skill Development Opportunities
            </motion.p>

            {/* Search Bar */}
            <motion.div 
              variants={itemVariants}
              className="flex items-center w-full max-w-lg bg-white/40 dark:bg-black/20 backdrop-blur-3xl rounded-full p-2 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 dark:border-white/10 transition-all duration-300 focus-within:ring-2 focus-within:ring-hero-blue/30 focus-within:shadow-[0_8px_30px_rgba(59,130,246,0.15)] mb-8"
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button 
                    type="button"
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.96 }}
                    className="flex items-center gap-1.5 bg-hero-blue/90 hover:bg-hero-blue backdrop-blur-md text-white px-5 py-3 rounded-full font-semibold text-sm transition-all duration-300 shadow-[0_2px_10px_rgba(59,130,246,0.2)] shrink-0 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-hero-blue/50"
                  >
                    Categories
                    <ChevronDown className="w-4 h-4 opacity-70" />
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="start"
                  sideOffset={12}
                  className="w-56 p-2 rounded-2xl bg-white/60 dark:bg-black/30 backdrop-blur-2xl border-white/40 dark:border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.08)]"
                >
                  {COURSE_CATEGORIES.map(({ label, icon: Icon, colorClass, hoverBg }) => (
                    <DropdownMenuItem 
                      key={label}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm font-semibold transition-all duration-300 ease-out outline-none",
                        "hover:text-white focus:text-white",
                        hoverBg
                      )}
                      onSelect={(e) => {
                        // Responding to interaction gracefully without heavy functionality logic
                      }}
                    >
                      <div className={cn("p-1.5 rounded-lg bg-white/70 dark:bg-white/5 backdrop-blur-md shadow-sm border border-white/20 dark:border-white/5", colorClass)}>
                        <Icon className="w-4 h-4" />
                      </div>
                      {label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <input
                type="text"
                placeholder="Search anything"
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                className="flex-1 bg-transparent border-none px-5 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0 min-w-0"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Search"
                className="p-3 bg-white/50 dark:bg-white/10 rounded-full text-muted-foreground hover:text-foreground hover:bg-white/80 transition-colors shrink-0 shadow-sm"
              >
                <Search className="w-5 h-5" />
              </motion.button>
            </motion.div>

            {/* Filter Pill Tags */}
            <motion.div 
              variants={itemVariants}
              className="flex flex-wrap gap-3"
            >
              {FILTER_TAGS.map(({ label, icon: Icon, value }) => {
                const isActive = activeCourseFilters.includes(value);
                return (
                  <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    key={value}
                    onClick={() => toggleCourseFilter(value)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-4 py-2 rounded-full border text-xs font-semibold transition-all duration-300 cursor-pointer overflow-hidden relative",
                      isActive
                        ? "bg-linear-to-r from-hero-blue to-[#4fabe3] border-transparent text-white shadow-[0_4px_14px_rgba(59,130,246,0.4)]"
                        : "bg-white/40 dark:bg-card/20 backdrop-blur-xl border-white/50 dark:border-white/10 shadow-sm text-foreground/80 hover:bg-white/60 hover:shadow-md",
                    )}
                  >
                    <Icon className={cn("w-3.5 h-3.5", isActive ? "text-white" : "opacity-70")} />
                    <span className="relative z-10">{label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeFilterGlow"
                        className="absolute inset-0 bg-white/10 rounded-full pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </motion.div>
          </motion.div>

          {/* ─────────────────────────────────────────────────────────────
               Right Column — figures + floating badges
               Layer order (back → front):
                 z-0  : Soft white card (depth backdrop)
                 z-10 : Teacher — blue bg div + thumb-2-1 SVG on top
                 z-20 : Orange circle — child accent
                 z-30 : Child — thumb-2-2 SVG (arch clip built-in)
                 z-40 : Floating stat badges
          ──────────────────────────────────────────────────────────── */}
          <div className="relative h-125 w-full hidden lg:block">
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
