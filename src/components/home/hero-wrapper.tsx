"use client";

import React from "react";
import dynamic from "next/dynamic";

const HeroSection = dynamic(() => import("@/components/home/hero-section"), { ssr: false });

export default function HeroWrapper() {
  return <HeroSection />;
}
