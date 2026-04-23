import HeroSection from "./components/HeroSection";
import ContentRow from "./components/shared/ContentRow";
import ImpactSection from "./components/ImpactSection";
import VisionSection from "./components/VisionSection";
import {
  HERO_SECTION,
  MISSION_SECTION,
  FOUNDER_INTRO,
  FOUNDER_JOURNEY,
  FOUNDER_VISION,
  IMPACT_SECTION,
  VISION_SECTION,
  ANIMATION_TIMINGS,
} from "./constants";

export default function AboutPage() {
  return (
    <main className="relative min-h-screen w-full overflow-x-hidden">
      <div className="pointer-events-none absolute left-0 top-0 z-0 h-125 w-full bg-linear-to-b from-[#f1f6f7] via-[#f4fafc] to-[#f4fafc]" />
      <div className="pointer-events-none absolute left-1/2 top-65 z-1 h-75 w-[150%] -translate-x-1/2 rounded-[70%] bg-white md:top-87.5 md:w-[110%]" />

      <div className="relative z-2 mx-auto flex max-w-325 flex-col gap-12 px-4 pb-8 pt-14 md:gap-18 md:px-12.5 md:pb-12.5 md:pt-20">
        <HeroSection
          label={HERO_SECTION.label}
          title={HERO_SECTION.title}
          gallery={HERO_SECTION.gallery}
        />

        <div className="flex flex-col gap-12 md:gap-18">
          <ContentRow
            label={MISSION_SECTION.label}
            title={MISSION_SECTION.title}
            content={MISSION_SECTION.content}
            image={MISSION_SECTION.image}
            delay={0}
          />

          <ContentRow
            label={FOUNDER_INTRO.label}
            title={FOUNDER_INTRO.title}
            content={FOUNDER_INTRO.content}
            image={FOUNDER_INTRO.image}
            reversed
            delay={ANIMATION_TIMINGS.stagger}
          />

          <ContentRow
            content={FOUNDER_JOURNEY.content}
            image={FOUNDER_JOURNEY.image}
            delay={ANIMATION_TIMINGS.stagger * 2}
          />

          <ContentRow
            content={FOUNDER_VISION.content}
            image={FOUNDER_VISION.image}
            reversed
            delay={ANIMATION_TIMINGS.stagger * 3}
          />

          <ImpactSection
            title={IMPACT_SECTION.title}
            items={IMPACT_SECTION.items}
          />

          <VisionSection
            image={VISION_SECTION.image}
            text={VISION_SECTION.text}
          />
        </div>
      </div>
    </main>
  );
}
