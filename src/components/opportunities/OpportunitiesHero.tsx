"use client";

import { Zap, Sparkles } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import { motion } from "framer-motion";
import OpportunitiesSearchInput from "./OpportunitiesSearchInput";

export default function OpportunitiesHero() {
  return (
    <section
      role="region"
      aria-label="Header section that includes search box"
      className="relative min-h-[45vh] flex flex-col overflow-hidden"
    >
      {/* Background with Parallax-like overlay */}
      <motion.div 
        initial={{ scale: 1.1 }}
        animate={{ scale: 1.05 }}
        transition={{ duration: 10, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/opportunities-hero-bg.jpg')",
          backgroundPosition: "50% 40%",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-slate-50/100 dark:to-slate-950/100" aria-hidden="true" />
      
      <div className="relative z-10 w-full flex-1 container mx-auto px-6 md:px-12 flex flex-col justify-center items-center text-center md:items-start md:text-start pt-12 pb-8">
        <div className="space-y-6 max-w-4xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-2"
          >
            <span className="inline-block px-4 py-1.5 bg-blue-500/20 backdrop-blur-md border border-blue-400/30 rounded-full text-blue-200 text-xs font-bold uppercase tracking-widest">
              Global Scholarship Database
            </span>
            <h1 className="text-5xl md:text-7xl font-black text-white leading-tight tracking-tighter">
              Browse <span className="text-[#55AAD4]">Opportunities</span>
            </h1>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xl md:text-2xl text-slate-200 max-w-2xl font-medium leading-relaxed"
          >
            Discover your next big step with our curated list of scholarships, grants, and programs worldwide.
          </motion.p>

          <OpportunitiesSearchInput />

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center gap-4 pt-2"
          >
            <Link
              href={ROUTES.AI_SEARCH}
              className="group flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 hover:border-white/40 cursor-pointer rounded-2xl text-sm font-bold text-white transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]"
            >
              <div className="p-1 bg-yellow-400 rounded-lg group-hover:rotate-12 transition-transform">
                <Zap size={16} fill="currentColor" className="text-slate-900" />
              </div>
              <span>Try AI Search Matching</span>
            </Link>
            <div className="hidden sm:flex items-center gap-2 text-slate-300 text-sm font-medium">
              <Sparkles size={16} className="text-blue-400 animate-pulse" />
              <span>Powered by intelligent matching algorithms</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
