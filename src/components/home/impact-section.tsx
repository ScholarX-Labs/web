"use client";

import React, { useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform, useInView } from "framer-motion";
import { HOME_DATA } from "@/lib/home-data";
import { sectionReveal } from "@/lib/motion-variants";
import { StaggerContainer, StaggerItem } from "@/components/animations/stagger";

function AnimatedCounter({ value, suffix, colorClass }: { value: number; suffix: string; colorClass?: string }) {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { stiffness: 50, damping: 20 });
  const displayValue = useTransform(springValue, (latest) => Math.round(latest));

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [isInView, motionValue, value]);

  return (
    <div ref={ref} className="flex items-baseline justify-center gap-1 font-bold tracking-tight">
      <motion.span className={`text-5xl md:text-6xl ${colorClass || "text-foreground"}`}>
        {displayValue}
      </motion.span>
      <span className={`text-3xl md:text-4xl ${colorClass || "text-foreground"}`}>
        {suffix}
      </span>
    </div>
  );
}

export function ImpactSection() {
  const { impact } = HOME_DATA;

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Subtle radial gradient background */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at center, rgba(59,130,246,0.03) 0%, transparent 70%)" }} />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        <motion.div 
          variants={sectionReveal} 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold mb-4">
            Our Global Impact
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Empowering minds worldwide
          </h2>
        </motion.div>

        <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center">
          {impact.map((metric) => (
            <StaggerItem key={metric.id} className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
              <AnimatedCounter value={metric.value} suffix={metric.suffix} colorClass={metric.colorClass} />
              <p className="mt-4 text-sm md:text-base font-medium text-muted-foreground uppercase tracking-wider">
                {metric.label}
              </p>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
