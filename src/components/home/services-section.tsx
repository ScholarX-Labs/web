"use client";

import React from "react";
import { motion } from "framer-motion";
import { HOME_DATA } from "@/lib/home-data";
import { slideFromLeft, slideFromRight } from "@/lib/motion-variants";
import { StaggerContainer, StaggerItem } from "@/components/animations/stagger";
import { GlassCard } from "@/components/ui/glass-panel";

export function ServicesSection() {
  const { whyChoose, whoWeHelp } = HOME_DATA.services;

  return (
    <section className="py-24 bg-slate-50 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          
          {/* Left Column: Why Choose */}
          <motion.div 
            variants={slideFromLeft}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            <h2 className="text-3xl font-bold text-foreground mb-8">Why Choose ScholarX</h2>
            <StaggerContainer className="flex flex-col gap-8">
              {whyChoose.map((item) => {
                const Icon = item.icon;
                return (
                  <StaggerItem key={item.id} className="flex gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">{item.heading}</h3>
                      <p className="text-muted-foreground">{item.body}</p>
                    </div>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </motion.div>

          {/* Right Column: Who We Help */}
          <motion.div 
            variants={slideFromRight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            <h2 className="text-3xl font-bold text-foreground mb-8">Who We Help</h2>
            <div className="flex flex-col gap-4">
              {whoWeHelp.map((persona) => {
                const Icon = persona.icon as React.ElementType; // Type cast since it could be string in model, but here it's Lucide
                return (
                  <GlassCard key={persona.id} className="p-6 flex items-start gap-4 hover:shadow-floating transition-shadow bg-white">
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-700 flex-shrink-0">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">{persona.label}</h3>
                      <p className="text-sm text-muted-foreground">{persona.description}</p>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
