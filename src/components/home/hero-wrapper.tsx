"use client";

import React from "react";
import dynamic from "next/dynamic";

// Keep the LCP content in the server response. The section remains a client
// component for CTA analytics, but excluding it from SSR delayed first paint.
const HeroSection = dynamic(() => import("@/components/home/hero-section"));

export default function HeroWrapper() {
  return <HeroSection />;
}
