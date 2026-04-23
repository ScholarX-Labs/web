/**
 * Home Page
 * Main landing page with Hero, Features, Services, and Impact sections
 */

import React, { memo } from "react";
import Hero from "./components/Hero/Hero";
import Features from "./components/Features/Features";
import ServicesSection from "./components/ServicesSection/ServicesSection";
import ImpactSection from "./components/ImpactSection/ImpactSection";
import {
  WHY_CHOOSE_SECTION,
  WHY_CHOOSE_SERVICES,
  WHO_WE_HELP_SECTION,
  WHO_WE_HELP_SERVICES,
} from "./constants";
import waterMark from "../../assets/Images/WaterMark.png";
import waterMark2 from "../../assets/Images/image.png";
import styles from "./Home.module.css";
import ErrorButton from "../../components/ErrorButton";

const Home = memo(function Home() {
  const isDev = import.meta.env.MODE === "development";

  return (
    <main className={styles.page}>
      {/* Sentry Test Button (Dev Only) */}
      {isDev && (
        <div style={{ position: "fixed", bottom: "20px", right: "20px", zIndex: 1000 }}>
          <ErrorButton />
        </div>
      )}

      {/* Hero Section */}
      <Hero />

      {/* Features Section */}
      <Features />

      {/* Why Choose ScholarX Section */}
      <ServicesSection
        title={WHY_CHOOSE_SECTION.title}
        highlight={WHY_CHOOSE_SECTION.highlight}
        description={WHY_CHOOSE_SECTION.description}
        services={WHY_CHOOSE_SERVICES}
        theme={WHY_CHOOSE_SECTION.theme}
        watermarkImage={waterMark}
      />

      {/* Who We Help Section */}
      <ServicesSection
        title={WHO_WE_HELP_SECTION.title}
        highlight={WHO_WE_HELP_SECTION.highlight}
        description={WHO_WE_HELP_SECTION.description}
        services={WHO_WE_HELP_SERVICES}
        theme={WHO_WE_HELP_SECTION.theme}
        watermarkImage={waterMark2}
      />

      {/* Impact Section */}
      <ImpactSection watermarkImage={waterMark} />
    </main>
  );
});

export default Home;
