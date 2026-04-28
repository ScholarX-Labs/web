"use client";

import React, { memo, useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { IMPACT_SECTION, IMPACT_STATS } from "@/lib/home-data";
import { 
  statCardReveal, 
  statIconReveal, 
  statIconFloating 
} from "@/lib/motion-variants";

interface StatItem {
  id: string;
  icon: React.ElementType;
  value: number;
  label: string;
  suffix?: string;
  animationDuration?: number;
}

const StatCard = memo(function StatCard({
  icon: Icon,
  value,
  label,
  suffix = "",
  animationDuration = 2000,
  delay = 0,
}: StatItem & { delay?: number }) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / animationDuration, 1);

      // Easing function for smooth counting
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    const timer = setTimeout(() => {
      animationFrame = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(timer);
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isVisible, value, animationDuration, delay]);

  return (
    <motion.div
      ref={cardRef}
      variants={statCardReveal}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      className="group relative flex min-h-[214px] w-full max-w-[396px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[15px] bg-white p-7 text-center shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-all duration-400 hover:-translate-y-2.5 hover:scale-[1.02] hover:shadow-[0_15px_40px_rgba(51,153,204,0.2),_0_0_0_1px_rgba(51,153,204,0.15)] max-md:min-h-[180px] max-md:max-w-full max-md:px-4 max-md:py-6"
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Background radial gradient expansion on hover */}
      <div className="absolute left-1/2 top-1/2 h-0 w-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(51,153,204,0.1)_0%,transparent_70%)] transition-all duration-600 group-hover:h-[300px] group-hover:w-[300px]" />

      <div className="relative z-10 mb-4 flex items-center gap-4 max-sm:flex-col max-sm:gap-2">
        {Icon && (
          <motion.div 
            variants={statIconReveal}
            className="flex h-[60px] w-[60px] items-center justify-center max-md:h-[50px] max-md:w-[50px]"
          >
            <motion.div
              variants={statIconFloating}
              animate="animate"
            >
              <Icon className="h-12 w-12 text-[#3399CC] drop-shadow-[0_2px_8px_rgba(51,153,204,0.3)] transition-all duration-300 group-hover:-rotate-3 group-hover:scale-[1.15] group-hover:drop-shadow-[0_4px_12px_rgba(51,153,204,0.5)] max-md:h-10 max-md:w-10" />
            </motion.div>
          </motion.div>
        )}
        <motion.span 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="relative text-[49px] font-bold leading-none text-[#FF6633] [text-shadow:0_2px_10px_rgba(255,102,51,0.2)] max-md:text-[40px] max-sm:text-[36px]"
        >
          {count.toLocaleString()}
          {suffix}
        </motion.span>
      </div>
      <h3 className="relative z-10 m-0 px-2.5 text-[25px] font-medium leading-[1.3] text-[#0A1F29] max-md:text-[20px] max-sm:text-[18px]">
        {label}
      </h3>
    </motion.div>
  );
});

export const ImpactSection = memo(function ImpactSection({
  watermarkImage,
}: {
  watermarkImage?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#D6EBF5_0%,rgba(214,235,245,0.3)_80%,transparent_100%)] px-8 py-25 max-md:px-5 max-md:py-15 max-sm:px-4 max-sm:py-12">
      {/* Background pattern */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(51,153,204,0.05)_0%,transparent_50%),radial-gradient(circle_at_80%_50%,rgba(255,102,51,0.05)_0%,transparent_50%)]" />

      {/* Watermark */}
      {watermarkImage && (
        <div className="pointer-events-none absolute -left-[30px] top-[15%] h-[368px] w-[368px] animate-[pulse_8s_ease-in-out_infinite] opacity-12 max-md:h-[250px] max-md:w-[250px]" aria-hidden="true">
          <Image src={watermarkImage} alt="" fill className="object-contain" />
        </div>
      )}

      <div className="relative z-10 mx-auto w-full max-w-[1400px]">
        {/* Header */}
        <div className="mb-15 animate-[fadeInDown_0.8s_ease-out] text-center max-md:mb-10">
          <h2 className="relative mb-5 inline-block text-[clamp(2rem,4vw,2.5rem)] font-semibold leading-[1.2] text-[#1a1a1a] max-md:text-[1.8rem] max-sm:text-[1.5rem]">
            {IMPACT_SECTION.title}{" "}
            <span className="relative text-[#3399CC] before:absolute before:-right-[25px] before:-top-[30px] before:animate-[bounceIn_1s_ease-out_0.5s_both] before:text-2xl before:content-['🎯'] max-md:before:-right-[20px] max-md:before:-top-[25px] max-md:before:text-[1.2rem]">
              {IMPACT_SECTION.highlight}
            </span>
          </h2>
          <p className="mx-auto max-w-[630px] text-[1.125rem] font-normal leading-[1.6] text-[#555555] max-md:text-base max-sm:text-[0.95rem]">
            {IMPACT_SECTION.description}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mx-auto grid max-w-[1300px] grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-8 max-lg:grid-cols-[repeat(auto-fit,minmax(280px,1fr))] max-lg:gap-6 max-md:grid-cols-1 max-md:gap-5">
          {IMPACT_STATS.map((stat, index) => (
            <StatCard
              key={stat.id}
              icon={stat.icon}
              value={stat.value}
              label={stat.label}
              suffix={stat.suffix}
              animationDuration={stat.animationDuration}
              delay={index * 100}
            />
          ))}
        </div>
      </div>
    </section>
  );
});

export default ImpactSection;
