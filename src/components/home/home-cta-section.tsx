"use client";

import React from "react";
import { motion } from "framer-motion";
import { HOME_DATA } from "@/lib/home-data";
import { sectionReveal, tapScale } from "@/lib/motion-variants";
import Link from "next/link";
import { GlassPanel } from "@/components/ui/glass-panel";

export function HomeCTASection() {
  const { headline, subline, buttonLabel, buttonHref } = HOME_DATA.cta;

  return (
    <section className="py-24 bg-background relative overflow-hidden flex flex-col items-center justify-center px-4">
      <div className="container max-w-5xl relative z-10">
        <motion.div 
          variants={sectionReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="relative"
        >
          {/* Ambient Glow behind panel */}
          <div className="absolute inset-0 bg-blue-600/20 blur-[100px] rounded-[3rem] -z-10" />
          
          <GlassPanel className="p-12 md:p-20 text-center flex flex-col items-center rounded-[2rem] bg-[#0a0f1e]/85 backdrop-blur-[40px] border border-white/10 shadow-elevated">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
              {headline}
            </h2>
            <p className="text-lg md:text-xl text-white/70 max-w-2xl mb-10">
              {subline}
            </p>
            <motion.div whileHover={tapScale.whileHover} whileTap={tapScale.whileTap}>
              <Link 
                href={buttonHref}
                className="inline-flex h-14 items-center justify-center rounded-xl bg-white px-10 text-base font-bold text-[#0a0f1e] transition-colors hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
              >
                {buttonLabel}
              </Link>
            </motion.div>
          </GlassPanel>
        </motion.div>
      </div>
    </section>
  );
}
