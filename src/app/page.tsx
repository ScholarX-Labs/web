import type { Metadata } from "next";
import { MotionWrapper } from "@/components/home/motion-wrapper";
import HeroWrapper from "@/components/home/hero-wrapper";
import { FeaturesSection } from "@/components/home/features-section";
import { ServicesSection } from "@/components/home/services-section";
import ImpactSection from "./about/components/ImpactSection";
import { HomeCTASection } from "@/components/home/home-cta-section";

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
    <main className="w-full relative overflow-x-hidden">
      <MotionWrapper>
        <HeroWrapper />
        <FeaturesSection />
        <ServicesSection />
        <ImpactSection title="Our Impact" items={[]} />
        <HomeCTASection />
      </MotionWrapper>
    </main>
  );
}
