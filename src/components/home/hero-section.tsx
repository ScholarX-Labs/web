"use client";

import React, { memo } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ArrowRight, ShieldCheck, GraduationCap, UsersRound } from "lucide-react";
import { useCtaTracking } from "@/components/analytics/use-cta-tracking";
import { Link } from "@/lib/i18n/navigation";
import { ROUTES } from "@/lib/routes";

const HERO_BUTTONS = [
  {
    id: "explore",
    type: "primary",
    link: ROUTES.SIGNUP,
    icon: ArrowRight,
  },
  {
    id: "join",
    type: "secondary",
    link: ROUTES.COURSES,
    icon: GraduationCap,
  },
] as const;

export const HeroSection = memo(function HeroSection() {
  const trackCta = useCtaTracking();
  const t = useTranslations("home.hero");

  return (
    <section className="relative flex min-h-[min(100vh,800px)] items-center overflow-hidden bg-background px-6 py-24 md:px-12 md:py-32">
      {/* Subtle Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      <div className="relative z-10 mx-auto grid w-full max-w-[1280px] grid-cols-1 items-center gap-16 lg:grid-cols-2">
        {/* Text Section */}
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <Badge
            variant="outline"
            className="mb-8 flex gap-2.5 py-2 px-5 rounded-full text-[var(--color-hero-blue)] border-[var(--color-hero-blue)]/20 bg-[var(--color-hero-blue)]/5 hover:bg-[var(--color-hero-blue)]/10 transition-colors"
          >
            <ShieldCheck className="h-4 w-4" />
            <span className="text-sm font-medium tracking-wide">
              {t("badge")}
            </span>
          </Badge>

          <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-[var(--color-hero-heading)] sm:text-5xl lg:text-6xl xl:text-7xl">
            {t("title")} <br className="hidden sm:block" />
            <span className="font-light text-muted-foreground">
              {t("subtitle")}
            </span>{" "}
            <span className="text-[var(--color-hero-blue)] relative inline-block underline decoration-[var(--color-hero-orange)] decoration-4 underline-offset-8">
              {t("highlight")}
            </span>
          </h1>

          <p className="mb-10 max-w-[600px] text-lg leading-relaxed text-[var(--color-hero-body)] sm:text-xl">
            {t("description")}
          </p>

          {/* CTA Buttons */}
          <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
            {HERO_BUTTONS.map((button) => {
              const Icon = button.icon;
              const isPrimary = button.type === "primary";

              return (
                <Button
                  key={button.id}
                  asChild
                  size="lg"
                  variant={isPrimary ? "default" : "outline"}
                  className={cn(
                    "group/hero-cta relative isolate h-16 w-full overflow-hidden rounded-full px-6 text-[15px] font-bold tracking-normal transition-all duration-300 ease-out cursor-pointer sm:w-auto sm:min-w-[190px]",
                    "focus-visible:ring-[3px] focus-visible:ring-[var(--color-hero-blue)]/25 motion-safe:hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0",
                    isPrimary
                      ? "border-0 bg-transparent text-white shadow-[0_18px_36px_-16px_rgba(51,153,204,0.75),0_10px_22px_-18px_rgba(255,106,58,0.75)] hover:bg-transparent hover:text-white hover:shadow-[0_24px_52px_-18px_rgba(51,153,204,0.9),0_16px_34px_-22px_rgba(255,106,58,0.75)] active:translate-y-0"
                      : "border border-[var(--color-hero-blue)]/20 bg-white/80 text-[var(--color-hero-heading)] shadow-[0_16px_36px_-24px_rgba(26,43,73,0.55)] backdrop-blur-xl hover:border-[var(--color-hero-blue)]/45 hover:bg-white hover:text-[var(--color-hero-blue)] hover:shadow-[0_22px_46px_-26px_rgba(51,153,204,0.65)] active:translate-y-0 dark:bg-white/10 dark:text-white dark:hover:bg-white/15",
                  )}
                >
                  <Link
                    href={button.link}
                    onClick={() => {
                      const label =
                        button.id === "explore"
                          ? t("primaryCta")
                          : t("secondaryCta");
                      trackCta({
                        ctaId: button.id,
                        ctaLabel: label,
                        ctaPlacement: "home_hero",
                        destination: button.link,
                      });
                    }}
                  >
                    {isPrimary ? (
                      <>
                        <span className="absolute inset-0 bg-[linear-gradient(135deg,var(--color-hero-blue)_0%,#2563eb_48%,var(--color-hero-orange)_100%)]" />
                        <span className="absolute -inset-x-12 inset-y-0 translate-x-[-130%] skew-x-[-18deg] bg-white/25 transition-transform duration-700 ease-out group-hover/hero-cta:translate-x-[130%] group-focus-visible/hero-cta:translate-x-[130%] motion-reduce:hidden" />
                        <span className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/35" />
                      </>
                    ) : (
                      <>
                        <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_20%_20%,rgba(51,153,204,0.14),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.94),rgba(255,255,255,0.7))] opacity-100 transition-opacity duration-300 group-hover/hero-cta:opacity-90 dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))]" />
                        <span className="absolute inset-0 rounded-full ring-1 ring-inset ring-[var(--color-hero-blue)]/10 transition-colors duration-300 group-hover/hero-cta:ring-[var(--color-hero-blue)]/25" />
                      </>
                    )}
                    <span className="relative z-10 flex w-full items-center justify-center gap-3">
                      <span
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-full transition-all duration-300",
                          isPrimary
                            ? "bg-white/18 text-white ring-1 ring-white/25 group-hover/hero-cta:bg-white/24"
                            : "bg-[var(--color-hero-blue)]/10 text-[var(--color-hero-blue)] group-hover/hero-cta:bg-[var(--color-hero-blue)] group-hover/hero-cta:text-white",
                        )}
                        aria-hidden="true"
                      >
                        <Icon className="h-4.5 w-4.5 transition-transform duration-300 group-hover/hero-cta:translate-x-0.5" />
                      </span>
                      <span className="whitespace-nowrap">
                        {button.id === "explore" ? t("primaryCta") : t("secondaryCta")}
                      </span>
                      {isPrimary && (
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/hero-cta:translate-x-1" />
                      )}
                    </span>
                  </Link>
                </Button>
              );
            })}
          </div>

          {/* Trust Metrics */}
          <div className="mt-10 grid w-full max-w-[520px] grid-cols-1 gap-3 sm:grid-cols-2 lg:justify-start">
            <div className="group/trust flex items-center gap-3 rounded-2xl border border-[var(--color-hero-blue)]/10 bg-white/75 px-4 py-3 text-left shadow-[0_14px_34px_-28px_rgba(26,43,73,0.65)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--color-hero-blue)]/25 hover:bg-white hover:shadow-[0_18px_42px_-30px_rgba(51,153,204,0.7)] motion-reduce:transform-none dark:bg-white/10 dark:hover:bg-white/15">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[var(--color-hero-orange)]/12 text-[var(--color-hero-orange)] ring-1 ring-[var(--color-hero-orange)]/15 transition-colors duration-300 group-hover/trust:bg-[var(--color-hero-orange)] group-hover/trust:text-white">
                <UsersRound className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-lg font-extrabold leading-none tracking-normal text-[var(--color-hero-heading)] dark:text-white">
                  10,000+
                </span>
                <span className="mt-1 block text-sm font-semibold leading-snug text-[var(--color-hero-body)] dark:text-white/70">
                  {t("studentsCountLabel")}
                </span>
              </span>
            </div>
            <div className="group/trust flex items-center gap-3 rounded-2xl border border-[var(--color-hero-blue)]/10 bg-white/75 px-4 py-3 text-left shadow-[0_14px_34px_-28px_rgba(26,43,73,0.65)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--color-hero-blue)]/25 hover:bg-white hover:shadow-[0_18px_42px_-30px_rgba(51,153,204,0.7)] motion-reduce:transform-none dark:bg-white/10 dark:hover:bg-white/15">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[var(--color-hero-blue)]/12 text-[var(--color-hero-blue)] ring-1 ring-[var(--color-hero-blue)]/15 transition-colors duration-300 group-hover/trust:bg-[var(--color-hero-blue)] group-hover/trust:text-white">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-lg font-extrabold leading-none tracking-normal text-[var(--color-hero-heading)] dark:text-white">
                  96
                </span>
                <span className="mt-1 block text-sm font-semibold leading-snug text-[var(--color-hero-body)] dark:text-white/70">
                  {t("partnersCountLabel")}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Image / Graphic Section */}
        <div className="relative mx-auto w-full max-w-[500px] lg:max-w-none">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-gray-50 border border-border shadow-2xl shadow-[var(--color-hero-blue)]/5">
            {/* The image wrapper */}
            <Image
              src="/home-page/hero1.png"
              alt=""
              fill
              priority
              sizes="(max-width: 1023px) 100vw, 50vw"
              className="object-cover object-center transition-transform duration-700 hover:scale-105"
            />

            {/* Minimalist Floating Card */}
            <div className="absolute bottom-8 left-8 right-8 rounded-2xl border border-white/40 bg-white/80 p-5 backdrop-blur-xl shadow-lg transition-transform hover:-translate-y-1">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[var(--color-hero-blue)]">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {t("expertTitle")}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {t("expertDescription")}
                  </p>
                </div>
              </div>
            </div>

            {/* Decorative Glow */}
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[var(--color-hero-blue)]/20 blur-3xl mix-blend-multiply" />
          </div>
        </div>
      </div>
    </section>
  );
});

export default HeroSection;
