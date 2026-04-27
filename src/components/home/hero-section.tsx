"use client";

import React, { memo } from "react";
import Link from "next/link";
import { HERO_CONTENT, HERO_BUTTONS } from "@/lib/home-data";

export const HeroSection = memo(function HeroSection() {
  return (
    <section className="relative flex min-h-[calc(100vh-80px)] items-center overflow-hidden bg-gradient-to-br from-[#3399CC]/10 to-transparent px-8 py-15 max-md:min-h-auto max-md:px-5 max-md:py-10">
      {/* Background Pattern */}
      <div className="animate-[float_20s_ease-in-out_infinite] absolute -right-[10%] -top-[50%] h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,rgba(51,153,204,0.1)_0%,transparent_70%)]" />

      <div className="relative z-10 mx-auto grid w-full max-w-[1400px] grid-cols-1 items-center gap-15 lg:grid-cols-2">
        {/* Text Section */}
        <div className="animate-[fadeInLeft_0.8s_ease-out] text-center lg:text-left">
          <h1 className="mb-6 animate-[fadeInUp_0.8s_ease-out_0.2s_both] text-[clamp(2rem,5vw,3.5rem)] font-bold leading-tight text-[#1a1a1a] max-md:text-[2rem]">
            {HERO_CONTENT.title}
            <br />
            {HERO_CONTENT.subtitle}{" "}
            <span className="relative inline-block text-[#3399CC] after:absolute after:-bottom-1 after:left-0 after:h-2 after:w-full after:animate-[slideInWidth_0.8s_ease-out_0.6s_both] after:rounded-md after:bg-gradient-to-r after:from-[#3399CC] after:to-[#3399CC]/30">
              {HERO_CONTENT.highlight}
            </span>
          </h1>
          <p className="mx-auto mb-10 max-w-[540px] animate-[fadeInUp_0.8s_ease-out_0.3s_both] text-lg leading-[1.7] text-gray-600 lg:mx-0 max-md:text-base">
            {HERO_CONTENT.description}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col flex-wrap items-stretch justify-center gap-4 sm:flex-row lg:justify-start">
            {HERO_BUTTONS.map((button, index) => {
              const Icon = button.icon;
              return (
                <Link
                  key={button.id}
                  href={button.link}
                  className="group relative inline-flex animate-[fadeInUp_0.8s_ease-out_both] cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl border-none px-7 py-3.5 text-base font-semibold text-white shadow-[0_4px_15px_rgba(51,153,204,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(51,153,204,0.4)]"
                  style={{
                    animationDelay: `${400 + index * 100}ms`,
                    background:
                      button.type === "primary"
                        ? "linear-gradient(135deg, #3399CC 0%, #2980b9 100%)"
                        : "#385361",
                  }}
                >
                  {/* Primary button pseudo element for hover shine */}
                  {button.type === "primary" && (
                    <span className="absolute inset-0 bg-gradient-to-br from-transparent to-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  )}
                  {button.text}
                  <span className="text-xl transition-transform duration-300 group-hover:translate-x-1">
                    <Icon className="h-5 w-5" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Image & Social Proof */}
        <div className="relative animate-[fadeInRight_0.8s_ease-out_0.4s_both]">
          <div className="animate-[morph_8s_ease-in-out_infinite] relative mx-auto h-[350px] w-full max-w-[400px] bg-gradient-to-br from-[#3399CC] to-[#2980b9] bg-[url('/home-page/hero1.png')] bg-cover bg-center shadow-[0_20px_60px_rgba(51,153,204,0.3)] sm:h-[400px] sm:max-w-[500px] lg:h-[500px]">
            {/* Social Proof Badge */}
            <div className="animate-[pulse-shadow_3s_ease-in-out_infinite] absolute -bottom-2 -right-2 z-10 flex -rotate-6 flex-col gap-1 rounded-2xl bg-gradient-to-br from-[#3399CC] to-[#2980b9] p-3 shadow-[0_10px_30px_rgba(51,153,204,0.4),_0_0_0_1px_rgba(255,255,255,0.1)] backdrop-blur-md lg:-right-26 lg:bottom-5 lg:-rotate-[12deg] lg:p-4">
              {/* Decorative Elements around the badge with original large sizes */}
              <div className="animate-[floatRotate1_12s_ease-in-out_infinite] absolute left-1/2 top-1/2 h-[450px] w-[450px] -translate-x-1/2 -translate-y-1/2 -rotate-3 rounded-[61%_39%_52%_48%/44%_59%_41%_56%] border-2 border-[#3399CC] opacity-40 lg:h-[520px] lg:w-[520px] max-sm:hidden" />
              <div className="animate-[floatRotate2_14s_ease-in-out_infinite] absolute left-1/2 top-1/2 h-[470px] w-[470px] -translate-x-1/2 -translate-y-1/2 rotate-3 rounded-[65%_35%_50%_50%/40%_62%_38%_60%] border-2 border-[#3399CC] opacity-30 lg:h-[540px] lg:w-[540px] max-sm:hidden" />
              <div className="animate-[floatRotate3_10s_ease-in-out_infinite] absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rotate-[10deg] rounded-[55%_45%_60%_40%/50%_50%_50%_50%] border-2 border-[#3399CC] opacity-20 lg:h-[480px] lg:w-[480px] max-sm:hidden" />

              <div className="relative z-20">
                <div className="mb-1 flex items-center">
                  <div className="animate-[fadeInScale_0.5s_ease-out_0.6s_both] relative h-7 w-7 rounded-full border-2 border-[#134577] bg-white bg-[url('/home-page/avatar1.png')] bg-cover bg-center transition-transform duration-300 hover:scale-110 lg:h-8 lg:w-8" />
                  <div className="animate-[fadeInScale_0.5s_ease-out_0.7s_both] relative -ml-2 h-7 w-7 rounded-full border-2 border-[#134577] bg-white bg-[url('/home-page/avatar2.png')] bg-cover bg-center transition-transform duration-300 hover:scale-110 lg:h-8 lg:w-8" />
                  <div className="animate-[fadeInScale_0.5s_ease-out_0.8s_both] relative -ml-2 h-7 w-7 rounded-full border-2 border-[#134577] bg-white bg-[url('/home-page/avatar3.png')] bg-cover bg-center transition-transform duration-300 hover:scale-110 lg:h-8 lg:w-8" />
                  <div className="animate-[fadeInScale_0.5s_ease-out_0.9s_both] -ml-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#134577] bg-gradient-to-br from-[#FF6633] to-[#e55a2b] text-[10px] font-bold text-white lg:h-8 lg:w-8 lg:text-xs">
                    10k+
                  </div>
                </div>
                <span className="animate-[fadeInUp_0.5s_ease-out_1s_both] block text-xs font-medium leading-snug text-white lg:text-sm">
                  Join {HERO_CONTENT.stats.count}+<br />
                  {HERO_CONTENT.stats.text}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

export default HeroSection;
