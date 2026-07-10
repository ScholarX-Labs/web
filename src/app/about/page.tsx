import HeroSection from "./components/HeroSection";
import ContentRow from "./components/shared/ContentRow";
import ImpactSection from "./components/ImpactSection";
import VisionSection from "./components/VisionSection";
import { useTranslations } from "next-intl";

export const revalidate = 86400;
export const dynamic = "force-static";

export default function AboutPage() {
  const t = useTranslations("about");

  const heroGallery = [
    { id: 1, src: "/about/img-1.png", alt: t("hero.gallery.img1Alt") },
    { id: 2, src: "/about/img-2.png", alt: t("hero.gallery.img2Alt") },
    { id: 3, src: "/about/img-3.png", alt: t("hero.gallery.img3Alt") },
  ] as const;

  const missionContent = [
    t("mission.paragraph1"),
    t("mission.paragraph2"),
  ] as const;

  const founderIntroContent = [
    t("founderIntro.paragraph1"),
    t("founderIntro.paragraph2"),
  ] as const;

  const founderJourneyContent = [
    t("founderJourney.paragraph1"),
    t("founderJourney.paragraph2"),
  ] as const;

  const founderVisionContent = [
    t("founderVision.paragraph1"),
    t("founderVision.paragraph2"),
  ] as const;

  const impactItems = [
    {
      id: "training",
      icon: "/about/icon-0.png",
      alt: t("impact.items.training.title"),
      title: t("impact.items.training.title"),
      description: t("impact.items.training.description"),
    },
    {
      id: "partnerships",
      icon: "/about/icon-1.png",
      alt: t("impact.items.partnerships.title"),
      title: t("impact.items.partnerships.title"),
      description: t("impact.items.partnerships.description"),
    },
    {
      id: "students",
      icon: "/about/icon-2.png",
      alt: t("impact.items.students.title"),
      title: t("impact.items.students.title"),
      description: t("impact.items.students.description"),
    },
    {
      id: "network",
      icon: "/about/icon-3.png",
      alt: t("impact.items.network.title"),
      title: t("impact.items.network.title"),
      description: t("impact.items.network.description"),
    },
    {
      id: "campaigns",
      icon: "/about/icon-4.png",
      alt: t("impact.items.campaigns.title"),
      title: t("impact.items.campaigns.title"),
      description: t("impact.items.campaigns.description"),
    },
  ];

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden">
      <div className="pointer-events-none absolute left-0 top-0 z-0 h-125 w-full bg-linear-to-b from-[#f1f6f7] via-[#f4fafc] to-[#f4fafc]" />
      <div className="pointer-events-none absolute left-1/2 top-65 z-1 h-75 w-[150%] -translate-x-1/2 rounded-[70%] bg-white md:top-87.5 md:w-[110%]" />

      <div className="relative z-2 mx-auto flex max-w-325 flex-col gap-12 px-4 pb-8 pt-14 md:gap-18 md:px-12.5 md:pb-12.5 md:pt-20">
        <HeroSection
          label={t("hero.label")}
          title={t("hero.title")}
          gallery={heroGallery}
        />

        <div className="flex flex-col gap-12 md:gap-18">
          <ContentRow
            label={t("mission.label")}
            title={t("mission.title")}
            content={missionContent}
            image={{
              src: "/about/img-students.png",
              alt: t("mission.imageAlt"),
            }}
            delay={0}
          />

          <ContentRow
            label={t("founderIntro.label")}
            title={t("founderIntro.title")}
            content={founderIntroContent}
            image={{
              src: "/about/founder-1.png",
              alt: t("founderIntro.imageAlt"),
              caption: t("founderIntro.caption"),
            }}
            reversed
            delay={100}
          />

          <ContentRow
            content={founderJourneyContent}
            image={{
              src: "/about/founder-2.png",
              alt: t("founderJourney.imageAlt"),
            }}
            delay={200}
          />

          <ContentRow
            content={founderVisionContent}
            image={{
              src: "/about/founder-3.png",
              alt: t("founderVision.imageAlt"),
            }}
            reversed
            delay={300}
          />

          <ImpactSection
            title={t("impact.title")}
            items={impactItems}
          />

          <VisionSection
            image={{
              src: "/about/group-vision.png",
              alt: t("vision.imageAlt"),
            }}
            text={t("vision.text")}
          />
        </div>
      </div>
    </main>
  );
}
