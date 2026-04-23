"use client";

import React from "react";
import { motion } from "framer-motion";
import { HOME_DATA } from "@/lib/home-data";
import { sectionReveal } from "@/lib/motion-variants";
import { StaggerContainer, StaggerItem } from "@/components/animations/stagger";
import { Parallax3DWrapper } from "@/components/animations/parallax-3d-card";
import { GlassCard } from "@/components/ui/glass-panel";

export function FeaturesSection() {
  const { features } = HOME_DATA;

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <motion.div 
          variants={sectionReveal} 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything you need to succeed
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our platform provides all the tools and resources required to master new skills and advance your career.
          </p>
        </motion.div>

        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <StaggerItem key={feature.id}>
                <Parallax3DWrapper className="h-full">
                  <GlassCard className="h-full flex flex-col items-start p-8 hover:bg-white/60 transition-colors">
                    <div className={`p-3 rounded-xl mb-6 ${feature.accentClass}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </GlassCard>
                </Parallax3DWrapper>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}
