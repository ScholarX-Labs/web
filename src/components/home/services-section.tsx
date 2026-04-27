"use client";

import React, { memo } from "react";
import Image from "next/image";
import { WHY_CHOOSE_SERVICES, WHO_WE_HELP_SERVICES } from "@/lib/home-data";

interface ServiceItem {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  color?: string;
}

interface ServicesSectionProps {
  title: string;
  highlight: string;
  description: string;
  services: ServiceItem[];
  theme?: "light" | "white";
  watermarkImage?: string;
}

const ServiceCard = memo(function ServiceCard({
  icon: Icon,
  title,
  description,
  color = "orange",
  delay = 0,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  color?: string;
  delay?: number;
}) {
  return (
    <div
      className="group relative flex min-h-[214px] w-full max-w-[396px] animate-[fadeInUp_0.6s_ease-out_forwards] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[15px] bg-white p-7 text-center opacity-0 shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-2.5 hover:shadow-[0_10px_30px_rgba(51,153,204,0.15),_0_0_0_1px_rgba(51,153,204,0.1)] max-md:min-h-[180px] max-md:max-w-full max-md:px-4 max-md:py-6"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Shine effect on hover */}
      <div className="absolute -left-full top-0 h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-[left] duration-500 group-hover:left-full" />

      {/* Icon Wrapper */}
      <div className="relative mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#D6EBF5] to-[#b8dff0] transition-all duration-300 group-hover:rotate-5 group-hover:scale-110 group-hover:shadow-[0_8px_20px_rgba(51,153,204,0.2)] max-md:mb-4 max-md:h-12 max-md:w-12">
        <Icon className="h-8 w-8 text-[#3399CC] transition-colors duration-300 group-hover:text-[#2980b9] max-md:h-7 max-md:w-7" />
        {/* Pulse animation ring */}
        <div className="absolute -inset-[5px] animate-[pulse_2s_ease-out_infinite] rounded-full border-2 border-[#3399CC] opacity-0" />
      </div>

      {/* Content */}
      <div className="w-full">
        <h3
          className={`mb-2.5 text-[25px] font-medium leading-[1.3] transition-colors duration-300 max-md:text-[20px] ${
            color === "orange" ? "text-[#FF6633]" : "text-[#0A1F29]"
          }`}
        >
          {title}
        </h3>
        <p className="m-0 text-base font-normal leading-[1.5] text-[#808080] max-md:text-sm">
          {description}
        </p>
      </div>
    </div>
  );
});

export const ServicesSection = memo(function ServicesSection({
  title,
  highlight,
  description,
  servicesKey,
  theme = "light",
  watermarkImage,
}: Omit<ServicesSectionProps, "services"> & { servicesKey: "whyChoose" | "whoWeHelp" }) {
  const services = servicesKey === "whyChoose" ? WHY_CHOOSE_SERVICES : WHO_WE_HELP_SERVICES;

  return (
    <section
      className={`relative overflow-hidden px-8 py-25 max-md:px-5 max-md:py-15 max-sm:px-4 max-sm:py-12 ${
        theme === "light"
          ? "bg-[linear-gradient(180deg,#D6EBF5_0%,rgba(214,235,245,0.3)_80%,transparent_100%)]"
          : "bg-white"
      }`}
    >
      {/* Watermark/Background Image */}
      {watermarkImage && (
        <div
          className={`pointer-events-none absolute h-[368px] w-[368px] animate-[rotateFloat_20s_linear_infinite] opacity-15 max-md:h-[250px] max-md:w-[250px] ${
            theme === "light"
              ? "-left-[50px] top-[10%] brightness-110"
              : "-right-[50px] top-[10%] brightness-95"
          }`}
          aria-hidden="true"
        >
          <Image
            src={watermarkImage}
            alt=""
            fill
            className="object-contain"
          />
        </div>
      )}

      <div className="relative z-10 mx-auto w-full max-w-[1400px]">
        {/* Header */}
        <div className="mb-15 animate-[fadeInDown_0.8s_ease-out] text-center max-md:mb-10">
          <h2 className="mb-5 text-[clamp(2rem,4vw,2.5rem)] font-semibold leading-[1.2] text-[#1a1a1a] max-md:text-[1.8rem] max-sm:text-[1.5rem]">
            {title}{" "}
            <span className="relative text-[#3399CC] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:animate-[expandUnderline_0.8s_ease-out_0.5s_both] after:rounded-[2px] after:bg-gradient-to-r after:from-[#3399CC] after:to-[#3399CC]/30">
              {highlight}
            </span>
          </h2>
          <p className="mx-auto max-w-[630px] text-[1.125rem] font-normal leading-[1.6] text-[#555555] max-md:text-base max-sm:text-[0.95rem]">
            {description}
          </p>
        </div>

        {/* Services Grid */}
        <div className="mx-auto grid max-w-[1300px] grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-8 max-lg:grid-cols-[repeat(auto-fit,minmax(280px,1fr))] max-lg:gap-6 max-md:grid-cols-1 max-md:gap-5">
          {services.map((service, index) => (
            <ServiceCard
              key={service.id}
              icon={service.icon}
              title={service.title}
              description={service.description}
              color={service.color}
              delay={index * 100}
            />
          ))}
        </div>
      </div>
    </section>
  );
});

export default ServicesSection;
