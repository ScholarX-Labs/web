"use client";

import React, { memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { FEATURES_CONTENT, FEATURES_LIST } from "@/lib/home-data";

export const FeaturesSection = memo(function FeaturesSection() {
  const Icon = FEATURES_CONTENT.cta.icon;

  return (
    <section className="relative overflow-hidden bg-white px-8 py-25 md:px-5 md:py-15 max-sm:py-12 max-sm:px-4">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-20 lg:grid-cols-2 lg:gap-20 max-lg:gap-15 max-md:gap-10">
        
        {/* Text Section */}
        <div className="animate-[fadeInLeft_0.8s_ease-out] max-lg:order-last">
          <h2 className="mb-6 animate-[fadeInUp_0.6s_ease-out_0.2s_both] text-[clamp(2rem,4vw,2.5rem)] font-bold leading-tight text-[#1a1a1a] max-md:text-[1.8rem] max-sm:text-[1.5rem]">
            {FEATURES_CONTENT.title}{" "}
            <span className="relative text-[#3399CC] after:absolute after:-bottom-0.5 after:left-0 after:right-0 after:h-1.5 after:animate-[expandWidth_0.8s_ease-out_0.8s_both] after:rounded-[3px] after:bg-gradient-to-r after:from-[#3399CC]/30 after:to-transparent">
              {FEATURES_CONTENT.highlight}
            </span>
          </h2>
          <p className="mb-8 animate-[fadeInUp_0.6s_ease-out_0.3s_both] text-[1.05rem] leading-[1.7] text-gray-600 max-md:text-base">
            {FEATURES_CONTENT.description}
          </p>

          <ul className="mb-10 list-none p-0">
            {FEATURES_LIST.map((item, index) => {
              const ItemIcon = item.icon;
              return (
                <li
                  key={item.id}
                  className="group mb-4 flex animate-[fadeInRight_0.5s_ease-out_both] items-center gap-3.5 text-base text-[#1a1a1a] opacity-0"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <span className="flex h-7 w-7 min-w-[28px] items-center justify-center rounded-full bg-gradient-to-br from-[#3399CC] to-[#2980b9] text-[0.85rem] font-bold text-white shadow-[0_3px_12px_rgba(51,153,204,0.3)] transition-all duration-300 group-hover:rotate-[10deg] group-hover:scale-[1.15] group-hover:shadow-[0_5px_18px_rgba(51,153,204,0.5)]">
                    <ItemIcon className="h-4 w-4" />
                  </span>
                  <span className="font-medium transition-colors duration-300 group-hover:text-[#3399CC]">
                    {item.text}
                  </span>
                </li>
              );
            })}
          </ul>

          <Link
            href={FEATURES_CONTENT.cta.link}
            className="group relative inline-flex animate-[fadeInUp_0.6s_ease-out_0.6s_both] items-center gap-2.5 overflow-hidden rounded-xl border-none bg-gradient-to-br from-[#3399CC] to-[#2980b9] px-8 py-3.5 text-base font-semibold text-white shadow-[0_6px_20px_rgba(51,153,204,0.3)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(51,153,204,0.4)] active:-translate-y-px max-md:w-full max-md:justify-center"
          >
            <span className="absolute inset-0 bg-gradient-to-br from-transparent to-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            {FEATURES_CONTENT.cta.text}
            <span className="text-xl transition-transform duration-300 group-hover:translate-x-[5px]">
              <Icon className="h-5 w-5" />
            </span>
          </Link>
        </div>

        {/* Image Section */}
        <div className="relative animate-[fadeInRight_0.8s_ease-out_0.4s_both]">
          <div className="group relative mx-auto w-full max-w-[540px] overflow-hidden rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.1)] transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_25px_70px_rgba(0,0,0,0.15)]">
            <Image
              src={FEATURES_CONTENT.image}
              alt={FEATURES_CONTENT.imageAlt}
              width={540}
              height={400}
              className="block h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Decorative Circles */}
            <div className="animate-[float_6s_ease-in-out_infinite] absolute -left-[50px] -top-[50px] -z-10 h-[200px] w-[200px] pointer-events-none rounded-full bg-[radial-gradient(circle,rgba(51,153,204,0.15)_0%,transparent_70%)] max-md:hidden" />
            <div className="animate-[float_8s_ease-in-out_infinite_reverse] absolute -bottom-[40px] -right-[40px] -z-10 h-[150px] w-[150px] pointer-events-none rounded-full bg-[radial-gradient(circle,rgba(255,102,51,0.12)_0%,transparent_70%)] max-md:hidden" />
          </div>
        </div>
      </div>
    </section>
  );
});

export default FeaturesSection;
