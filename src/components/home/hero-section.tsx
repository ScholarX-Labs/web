"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { HOME_DATA } from "@/lib/home-data";
import { heroEntrance, tapScale } from "@/lib/motion-variants";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

export default function HeroSection() {
  const heroRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const orb1Ref = useRef<HTMLDivElement>(null);
  const orb2Ref = useRef<HTMLDivElement>(null);
  const bgGradientRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check for reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    let ctx: any;

    const initGsap = async () => {
      const gsap = (await import("gsap")).default;
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        gsap.to(textRef.current, {
          y: -60,
          ease: "none",
          scrollTrigger: { trigger: heroRef.current, start: "top top", end: "bottom top", scrub: 1 },
        });
        gsap.to(orb1Ref.current, {
          y: -200,
          ease: "none",
          scrollTrigger: { trigger: heroRef.current, start: "top top", end: "bottom top", scrub: 1.5 },
        });
        gsap.to(orb2Ref.current, {
          y: -80,
          ease: "none",
          scrollTrigger: { trigger: heroRef.current, start: "top top", end: "bottom top", scrub: 0.8 },
        });
        gsap.to(bgGradientRef.current, {
          y: -120,
          ease: "none",
          scrollTrigger: { trigger: heroRef.current, start: "top top", end: "bottom top", scrub: 1.2 },
        });
      }, heroRef);
    };

    initGsap();

    return () => {
      if (ctx) ctx.revert();
    };
  }, []);

  const { badge, headline, subline, primaryCTA, secondaryCTA } = HOME_DATA.hero;

  return (
    <section 
      ref={heroRef}
      className="min-h-screen relative overflow-hidden bg-[#0a0f1e] flex flex-col items-center justify-center pt-24 pb-12"
      aria-label="ScholarX hero section"
    >
      {/* Background Parallax Layers */}
      <div 
        ref={bgGradientRef}
        className="absolute inset-0 pointer-events-none transform-gpu opacity-40 mix-blend-screen"
        style={{ background: "radial-gradient(circle at 50% 100%, rgba(59,130,246,0.15) 0%, transparent 60%)" }}
      />
      <div 
        ref={orb1Ref}
        className="absolute top-[10%] left-[15%] w-64 h-64 bg-blue-500/20 blur-[100px] rounded-full pointer-events-none transform-gpu"
        aria-hidden="true"
      />
      <div 
        ref={orb2Ref}
        className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-purple-500/20 blur-[120px] rounded-full pointer-events-none transform-gpu"
        aria-hidden="true"
      />

      <div className="absolute inset-0 bg-[#0a0f1e]/60 backdrop-blur-[40px] pointer-events-none z-0" />

      {/* Content */}
      <div className="container relative z-10 px-4 sm:px-6 lg:px-8 mx-auto flex flex-col items-center text-center">
        <motion.div 
          ref={textRef}
          variants={heroEntrance} 
          initial="hidden" 
          animate="visible"
          className="flex flex-col items-center max-w-4xl transform-gpu"
        >
          <motion.span 
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            className="inline-flex items-center px-3 py-1 rounded-full border border-white/10 bg-white/5 text-sm font-medium text-white/80 mb-8 backdrop-blur-md shadow-inner"
          >
            {badge}
          </motion.span>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-6">
            {headline.map((line, i) => (
              <motion.span 
                key={i} 
                className="block"
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              >
                {line}
              </motion.span>
            ))}
          </h1>

          <motion.p 
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            className="text-lg md:text-xl text-white/70 max-w-2xl mb-10 leading-relaxed"
          >
            {subline}
          </motion.p>

          <motion.div 
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            className="flex flex-col sm:flex-row gap-4 items-center"
          >
            <motion.div whileHover={tapScale.whileHover} whileTap={tapScale.whileTap}>
              <Link 
                href={primaryCTA.href}
                className="inline-flex h-12 items-center justify-center rounded-xl bg-white px-8 text-sm font-semibold text-[#0a0f1e] transition-colors hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
              >
                {primaryCTA.label}
              </Link>
            </motion.div>
            
            <motion.div whileHover={tapScale.whileHover} whileTap={tapScale.whileTap}>
              <Link 
                href={secondaryCTA.href}
                className="inline-flex h-12 items-center justify-center rounded-xl border border-white/20 bg-white/5 px-8 text-sm font-semibold text-white transition-colors hover:bg-white/10 backdrop-blur-sm"
              >
                {secondaryCTA.label}
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-white/40 animate-bounce"
      >
        <ChevronDown className="w-6 h-6" />
      </motion.div>
    </section>
  );
}
