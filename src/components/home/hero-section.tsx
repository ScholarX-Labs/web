"use client";

import React, { memo } from "react";
import Link from "next/link";
import { HERO_CONTENT, HERO_BUTTONS } from "@/lib/home-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, GraduationCap } from "lucide-react";

export const HeroSection = memo(function HeroSection() {
  return (
    <section className="relative flex min-h-[min(100vh,800px)] items-center overflow-hidden bg-background px-6 py-24 md:px-12 md:py-32">
      {/* Subtle Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      <div className="relative z-10 mx-auto grid w-full max-w-[1280px] grid-cols-1 items-center gap-16 lg:grid-cols-2">
        {/* Text Section */}
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <Badge
            variant="outline"
            className="mb-8 flex gap-2.5 py-2 px-5 rounded-full text-[var(--color-hero-blue)] border-[var(--color-hero-blue)]/20 bg-[var(--color-hero-blue)]/5 hover:bg-[var(--color-hero-blue)]/10 transition-colors"
          >
            <ShieldCheck className="h-4 w-4" />
            <span className="text-sm font-medium tracking-wide">
              Verified & Premium Academic Standards
            </span>
          </Badge>

          <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-[var(--color-hero-heading)] sm:text-5xl lg:text-6xl xl:text-7xl">
            {HERO_CONTENT.title} <br className="hidden sm:block" />
            <span className="font-light text-muted-foreground">
              {HERO_CONTENT.subtitle}
            </span>{" "}
            <span className="text-[var(--color-hero-blue)] relative inline-block underline decoration-[var(--color-hero-orange)] decoration-4 underline-offset-8">
              {HERO_CONTENT.highlight}
            </span>
          </h1>

          <p className="mb-10 max-w-[600px] text-lg leading-relaxed text-[var(--color-hero-body)] sm:text-xl">
            {HERO_CONTENT.description}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col w-full sm:w-auto sm:flex-row items-center gap-4">
            {HERO_BUTTONS.map((button) => {
              const Icon = button.icon;
              const isPrimary = button.type === "primary";

              return (
                <Button
                  key={button.id}
                  asChild
                  size="lg"
                  variant={isPrimary ? "default" : "outline"}
                  className={`group w-full sm:w-auto h-14 px-8 text-base transition-all duration-300 ${
                    isPrimary
                      ? "bg-[var(--color-hero-blue)] hover:bg-[var(--color-hero-blue-dark)] text-white shadow-md hover:shadow-lg hover:-translate-y-0.5"
                      : "border-border text-foreground hover:bg-accent/50"
                  }`}
                >
                  <Link href={button.link}>
                    {button.text}
                    <Icon className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </Button>
              );
            })}
          </div>

          {/* Trust Metrics */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 text-sm font-medium text-muted-foreground lg:justify-start">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-[var(--color-hero-orange)]" />
              <span>
                {HERO_CONTENT.stats.count}+ {HERO_CONTENT.stats.text}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[var(--color-hero-blue)]" />
              <span>Trusted by 96 Partners</span>
            </div>
          </div>
        </div>

        {/* Image / Graphic Section */}
        <div className="relative mx-auto w-full max-w-[500px] lg:max-w-none">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-gray-50 border border-border shadow-2xl shadow-[var(--color-hero-blue)]/5">
            {/* The image wrapper */}
            <div className="absolute inset-0 bg-[url('/home-page/hero1.png')] bg-cover bg-center transition-transform duration-700 hover:scale-105" />

            {/* Minimalist Floating Card */}
            <div className="absolute bottom-8 left-8 right-8 rounded-2xl border border-white/40 bg-white/80 p-5 backdrop-blur-xl shadow-lg transition-transform hover:-translate-y-1">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[var(--color-hero-blue)]">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Expert-Led Courses
                  </h3>
                  <p className="text-sm text-gray-600">
                    Master new skills with industry leaders
                  </p>
                </div>
              </div>
            </div>

            {/* Decorative Glow */}
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[var(--color-hero-blue)]/20 blur-3xl mix-blend-multiply" />
          </div>
        </div>
      </div>
    </section>
  );
});

export default HeroSection;
