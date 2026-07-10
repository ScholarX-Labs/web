import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import HeroWrapper from "@/components/home/hero-wrapper";
import FeaturesSection from "@/components/home/features-section";
import ServicesSection from "@/components/home/services-section";
import ImpactSection from "@/components/home/impact-section";

export const revalidate = 86400;
export const dynamic = "force-static";

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


export default async function HomePage() {
  const t = await getTranslations("home");
  return (
    <main className="relative w-full overflow-x-hidden">
      {/* Hero Section */}
      <HeroWrapper />

      {/* Features Section */}
      <FeaturesSection />

      {/* Why Choose ScholarX Section */}
      <ServicesSection
        title={t("whyChoose.title")}
        highlight={t("whyChoose.highlight")}
        description={t("whyChoose.description")}
        servicesKey="whyChoose"
        theme="light"
        watermarkImage="/ScholarX-Logo-Icon-Blue_ScholarX.svg"
      />

      {/* Who We Help Section */}
      <ServicesSection
        title={t("whoWeHelp.title")}
        highlight={t("whoWeHelp.highlight")}
        description={t("whoWeHelp.description")}
        servicesKey="whoWeHelp"
        theme="white"
        watermarkImage="/ScholarX-Logo-Icon-Blue_ScholarX.svg"
      />

      {/* Impact Section */}
      <ImpactSection watermarkImage="/ScholarX-Logo-Icon-Blue_ScholarX.svg" />
    </main>
  );
}
