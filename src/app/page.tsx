import type { Metadata } from "next";
import HeroWrapper from "@/components/home/hero-wrapper";
import FeaturesSection from "@/components/home/features-section";
import ServicesSection from "@/components/home/services-section";
import ImpactSection from "@/components/home/impact-section";
import {
  WHY_CHOOSE_SECTION,
  WHO_WE_HELP_SECTION,
} from "@/lib/home-data";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "ScholarX — Premium Learning Platform",
  description:
    "Discover world-class courses crafted by industry experts. Join thousands of learners on ScholarX.",
  openGraph: {
    title: "ScholarX — Premium Learning Platform",
    description: "Discover world-class courses crafted by industry experts.",
    type: "website",
  },
};


export default function HomePage() {
  return (
    <main className="relative w-full overflow-x-hidden">
      {/* Hero Section */}
      <HeroWrapper />

      {/* Features Section */}
      <FeaturesSection />

      {/* Why Choose ScholarX Section */}
      <ServicesSection
        title={WHY_CHOOSE_SECTION.title}
        highlight={WHY_CHOOSE_SECTION.highlight}
        description={WHY_CHOOSE_SECTION.description}
        servicesKey="whyChoose"
        theme="light"
        watermarkImage="/assets/Images/WaterMark.png"
      />

      {/* Who We Help Section */}
      <ServicesSection
        title={WHO_WE_HELP_SECTION.title}
        highlight={WHO_WE_HELP_SECTION.highlight}
        description={WHO_WE_HELP_SECTION.description}
        servicesKey="whoWeHelp"
        theme="white"
        watermarkImage="/assets/Images/image.png"
      />

      {/* Impact Section */}
      <ImpactSection watermarkImage="/assets/Images/WaterMark.png" />
    </main>
  );
}
