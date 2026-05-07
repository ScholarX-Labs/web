import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import { SearchX, ChevronLeft, Home } from "lucide-react";

export default function CourseNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center animate-in fade-in zoom-in duration-500">
      <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-6 ring-4 ring-white dark:ring-slate-900 shadow-xl shadow-slate-200/20 dark:shadow-black/20">
        <SearchX className="w-10 h-10 text-slate-400" />
      </div>
      <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">
        Course Not Found
      </h1>
      <p className="text-base text-slate-500 dark:text-slate-400 max-w-md mb-10 leading-relaxed">
        We couldn&apos;t track down the course you&apos;re looking for. It may have been
        retired or the link might be broken.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto">
        <Link
          href={ROUTES.COURSES}
          className="flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-full transition-colors active:scale-95"
        >
          <ChevronLeft className="w-4 h-4" />
          Browse All Courses
        </Link>
        <Link
          href={ROUTES.HOME}
          className="flex items-center justify-center gap-2 px-6 py-3.5 bg-linear-to-r from-hero-blue to-hero-blue-dark hover:from-[#3db3ec] hover:to-[#2b90ca] text-white font-bold rounded-full shadow-lg shadow-hero-blue/20 transition-all hover:scale-105 active:scale-95"
        >
          <Home className="w-4 h-4" />
          Return Home
        </Link>
      </div>
    </div>
  );
}
