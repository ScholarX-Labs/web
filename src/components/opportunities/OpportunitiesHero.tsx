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
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/20 dark:from-black/80 dark:via-black/50 dark:to-slate-950/20" aria-hidden="true" />
      
      <div className="relative z-10 w-full flex-1 container mx-auto px-6 sm:px-8 lg:px-12 flex flex-col justify-center items-center text-center md:items-start md:text-start pt-16 pb-16">
        <div className="space-y-6 max-w-4xl w-full">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-2"
          >
            <span className="inline-block px-4 py-1.5 bg-blue-500/20 backdrop-blur-md border border-blue-400/30 rounded-full text-blue-100 text-xs font-bold uppercase tracking-widest">
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
            className="text-xl md:text-2xl text-white/90 max-w-2xl font-medium leading-relaxed"
          >
            Discover your next big step with our curated list of scholarships, grants, and programs worldwide.
          </motion.p>

          <OpportunitiesSearchInput />

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center gap-4 pt-4"
          >
            <Link
              href={ROUTES.AI_SEARCH}
              className="group flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/30 hover:border-white/50 cursor-pointer rounded-2xl text-sm font-bold text-white transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,255,255,0.15)] shadow-lg"
            >
              <div className="p-1 bg-yellow-400 rounded-lg group-hover:rotate-12 transition-transform shadow-[0_0_15px_rgba(250,204,21,0.4)]">
                <Zap size={16} fill="currentColor" className="text-slate-900" />
              </div>
              <span>Try AI Search Matching</span>
            </Link>
            <div className="hidden sm:flex items-center gap-2.5 text-white font-bold drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
              <div className="relative">
                <Sparkles size={18} className="text-blue-300 animate-pulse relative z-10" />
                <div className="absolute inset-0 bg-blue-400/40 blur-md animate-pulse" />
              </div>
              <span className="text-sm tracking-tight">Powered By ScholarX AI</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
