"use client";

import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  Bot,
  BookOpen,
  Compass,
  Home,
  Info,
  LogIn,
  MessageCircle,
  User,
} from "lucide-react";
import { useTranslations } from "next-intl";
import PremiumMobileMenu from "@/components/PremiumMobileMenu";
import HamburgerIcon from "@/components/HamburgerIcon";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { useScrollDirection } from "@/hooks/use-scroll-direction";
import SignoutButton from "@/app/auth/_components/SignoutButton";
import { Button } from "@/components/ui/button";
import { useCtaTracking } from "@/components/analytics/use-cta-tracking";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { LocaleSwitcher } from "@/components/locale-switcher";

const SCHOLARX_HORIZONTAL_LOGO =
  "/ScholarX-Logo-horizontal-Blue-Solid-Small_ScholarX.png";

const EXPAND_SCROLL_THRESHOLD = 50;
const DOCK_EFFECT_WIDTH = 280;
const DOCK_MAX_SCALE = 1.2;
const DOCK_MIN_SCALE = 1;

function getDockScale(
  centerX: number | undefined,
  mouseX: number | null,
  active: boolean,
) {
  if (mouseX === null || centerX === undefined) {
    return active ? 1.04 : DOCK_MIN_SCALE;
  }

  const minX = mouseX - DOCK_EFFECT_WIDTH / 2;
  const maxX = mouseX + DOCK_EFFECT_WIDTH / 2;

  if (centerX < minX || centerX > maxX) {
    return active ? 1.02 : DOCK_MIN_SCALE;
  }

  const theta = ((centerX - minX) / DOCK_EFFECT_WIDTH) * 2 * Math.PI;
  const cappedTheta = Math.min(Math.max(theta, 0), 2 * Math.PI);
  const scaleFactor = (1 - Math.cos(cappedTheta)) / 2;

  return DOCK_MIN_SCALE + scaleFactor * (DOCK_MAX_SCALE - DOCK_MIN_SCALE);
}

function useNavItems() {
  const t = useTranslations("common");

  return [
    { label: t("nav.home"), href: ROUTES.HOME, icon: Home },
    { label: t("nav.about"), href: ROUTES.ABOUT, icon: Info },
    { label: t("nav.courses"), href: ROUTES.COURSES, icon: BookOpen },
    { label: t("nav.opportunities"), href: ROUTES.OPPORTUNITIES, icon: Compass },
    { label: t("nav.aiSearch"), href: ROUTES.AI_SEARCH, icon: Bot },
    { label: t("nav.contact"), href: ROUTES.CONTACT, icon: MessageCircle },
  ];
}

function NavLinks({
  isActive,
  navItems,
}: {
  isActive: (href: string) => boolean;
  navItems: ReturnType<typeof useNavItems>;
}) {
  const dockRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [mouseX, setMouseX] = useState<number | null>(null);
  const [itemCenters, setItemCenters] = useState<number[]>([]);
  const shouldReduceMotion = useReducedMotion();

  const measureItems = useCallback(() => {
    const dockRect = dockRef.current?.getBoundingClientRect();
    if (!dockRect) return;

    setItemCenters(
      linkRefs.current.map((item) => {
        if (!item) return 0;

        const rect = item.getBoundingClientRect();
        return rect.left - dockRect.left + rect.width / 2;
      }),
    );
  }, []);

  useEffect(() => {
    measureItems();
    window.addEventListener("resize", measureItems);

    return () => window.removeEventListener("resize", measureItems);
  }, [measureItems]);

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (shouldReduceMotion) return;

      const rect = dockRef.current?.getBoundingClientRect();
      if (!rect) return;

      setMouseX(event.clientX - rect.left);
    },
    [shouldReduceMotion],
  );

  const handleMouseLeave = useCallback(() => {
    setMouseX(null);
  }, []);

  const closestIndex =
    mouseX === null
      ? null
      : itemCenters.reduce(
          (closest, center, index) => {
            const distance = Math.abs(center - mouseX);
            return distance < closest.distance ? { index, distance } : closest;
          },
          { index: -1, distance: Number.POSITIVE_INFINITY },
        ).index;

  return (
    <motion.div
      ref={dockRef}
      className="flex items-end gap-1 overflow-visible rounded-full px-1 py-1"
      onMouseMove={handleMouseMove}
      onMouseEnter={measureItems}
      onMouseLeave={handleMouseLeave}
    >
      {navItems.map((item, index) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        const scale = shouldReduceMotion
          ? active
            ? 1.04
            : 1
          : getDockScale(itemCenters[index], mouseX, active);
        const lift = mouseX === null ? 0 : -Math.round((scale - 1) * 42);
        const isClosest = closestIndex === index;
        const showDockBubble = mouseX !== null && isClosest;
        const showActiveBubble = active && !showDockBubble;

        return (
          <motion.div
            key={item.label}
            animate={{ scale, y: lift }}
            transition={{
              type: "spring",
              stiffness: mouseX === null ? 320 : 520,
              damping: mouseX === null ? 26 : 30,
              mass: 0.62,
            }}
            className="relative origin-bottom rounded-full will-change-transform"
          >
            {(showActiveBubble || showDockBubble) && (
              <motion.span
                layoutId={showDockBubble ? "nav-dock-glow" : "nav-indicator"}
                className={cn(
                  "absolute inset-0 rounded-full",
                  showDockBubble
                    ? "bg-white/90 shadow-[0_16px_32px_-18px_rgba(51,153,204,0.75),0_0_0_1px_rgba(51,153,204,0.18),inset_0_1px_0_rgba(255,255,255,0.95)] dark:bg-white/12 dark:shadow-[0_16px_34px_-18px_rgba(51,153,204,0.85),0_0_0_1px_rgba(255,255,255,0.12)]"
                    : "bg-[var(--color-hero-blue)]/10",
                )}
                transition={{ type: "spring", stiffness: 420, damping: 30 }}
              />
            )}
            {showDockBubble && (
              <motion.span
                layoutId="nav-dock-shadow"
                className="pointer-events-none absolute -inset-x-2 -bottom-3 h-6 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(51,153,204,0.34),transparent_68%)] blur-md"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.18 }}
              />
            )}
            <Link
              ref={(node) => {
                linkRefs.current[index] = node;
              }}
              href={item.href}
              title={item.label}
              onFocus={() => setMouseX(itemCenters[index] ?? null)}
              onBlur={() => setMouseX(null)}
              className={cn(
                "group/nav-item relative z-10 inline-flex h-10 items-center justify-center gap-2 rounded-full px-3 text-sm font-semibold tracking-normal",
                "cursor-pointer select-none outline-none transition-colors duration-200",
                "focus-visible:ring-3 focus-visible:ring-[var(--color-hero-blue)]/25",
                active || showDockBubble
                  ? "text-[var(--color-hero-heading)] dark:text-white"
                  : "text-foreground/70 hover:text-[var(--color-hero-heading)] dark:hover:text-white",
              )}
            >
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-xl transition-all duration-200",
                  active || showDockBubble
                    ? "bg-[var(--color-hero-blue)]/12 text-[var(--color-hero-blue)] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] ring-1 ring-[var(--color-hero-blue)]/15 dark:bg-white/12 dark:text-white dark:ring-white/10"
                    : "bg-foreground/[0.04] text-foreground/55 ring-1 ring-foreground/[0.06] group-hover/nav-item:bg-[var(--color-hero-blue)]/10 group-hover/nav-item:text-[var(--color-hero-blue)]",
                )}
                aria-hidden="true"
              >
                <Icon
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200",
                    showDockBubble && "-translate-y-0.5 scale-110",
                  )}
                />
              </span>
              {item.label}
            </Link>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

function AuthButtons({ isLoggedIn }: { isLoggedIn: boolean }) {
  const t = useTranslations("common");
  const trackCta = useCtaTracking();

  if (isLoggedIn) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href={ROUTES.PROFILE}
          aria-label={t("nav.profile")}
          className="p-2 rounded-full hover:bg-muted/50 transition-colors duration-200"
        >
          <User className="h-5 w-5 text-foreground/70" />
        </Link>
        <div className="hidden lg:block">
          <SignoutButton className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all duration-200 active:scale-[0.97]">
            {t("auth.logout")}
          </SignoutButton>
        </div>
      </div>
    );
  }

  return (
    <div className="hidden lg:flex items-center gap-3">
      <Link
        href={ROUTES.SIGNIN}
        onClick={() => {
          trackCta({
            ctaId: "header_login",
            ctaLabel: t("auth.login"),
            ctaPlacement: "header_auth",
            destination: ROUTES.SIGNIN,
          });
        }}
        className="group inline-flex h-10 items-center gap-2 rounded-full border border-[var(--color-hero-blue)]/15 bg-white/75 px-4 text-sm font-semibold text-[var(--color-hero-heading)] shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--color-hero-blue)]/30 hover:bg-[var(--color-hero-blue)]/6 hover:text-[var(--color-hero-blue)] hover:shadow-[0_16px_32px_-24px_rgba(51,153,204,0.75)]"
      >
        <LogIn className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
        {t("auth.login")}
      </Link>
      <Button
        asChild
        size="sm"
        className="group h-10 rounded-full bg-[linear-gradient(135deg,var(--color-hero-blue)_0%,#2563eb_60%,var(--color-hero-orange)_100%)] px-5 text-sm font-semibold text-white shadow-[0_18px_36px_-18px_rgba(51,153,204,0.9)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_44px_-20px_rgba(51,153,204,1)]"
      >
        <Link
          href={ROUTES.SIGNUP}
          onClick={() => {
            trackCta({
              ctaId: "header_signup",
              ctaLabel: t("auth.signup"),
              ctaPlacement: "header_auth",
              destination: ROUTES.SIGNUP,
            });
          }}
        >
          {t("auth.signup")}
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
        </Link>
      </Button>
    </div>
  );
}

function DesktopHeader({
  isLoggedIn,
  isActive,
  navItems,
}: {
  isLoggedIn: boolean;
  isActive: (href: string) => boolean;
  navItems: ReturnType<typeof useNavItems>;
}) {
  const { direction, isAtTop } = useScrollDirection(15);
  const t = useTranslations("common");

  return (
    <motion.header
      className={cn(
        "fixed top-0 inset-x-0 z-50 hidden lg:flex",
        "h-[72px]",
        "items-center justify-center",
        "px-4",
      )}
      initial={{ y: 0 }}
      animate={{
        y: direction === "down" && !isAtTop ? -100 : 0,
      }}
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
    >
      <motion.div
        className={cn(
          "w-full max-w-7xl flex items-center justify-between",
          "h-14",
          "px-6",
          "rounded-2xl",
          "bg-background/70 dark:bg-[#0a0f1e]/70",
          "backdrop-blur-2xl",
          "border border-border/50 dark:border-white/[0.07]",
          "shadow-sm",
        )}
        initial={{ opacity: 0, y: -20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 250,
          damping: 25,
          mass: 1,
        }}
      >
        <Link href={ROUTES.HOME} className="shrink-0">
          <Image
            alt={t("header.logoAlt")}
            src={SCHOLARX_HORIZONTAL_LOGO}
            width={180}
            height={32}
            style={{ width: "auto", height: "32px", objectFit: "contain" }}
            className="hover:cursor-pointer"
          />
        </Link>

        <nav aria-label={t("header.mainNavigation")} className="flex items-center gap-1">
          <NavLinks isActive={isActive} navItems={navItems} />
        </nav>

        <div className="flex items-center gap-2">
          <LocaleSwitcher className="hidden xl:inline-flex" />
          <AuthButtons isLoggedIn={isLoggedIn} />
        </div>
      </motion.div>
    </motion.header>
  );
}

function MobileCollapsibleHeader({
  isLoggedIn,
  isActive,
  navItems,
}: {
  isLoggedIn: boolean;
  isActive: (href: string) => boolean;
  navItems: ReturnType<typeof useNavItems>;
}) {
  const t = useTranslations("common");
  const [isExpanded, setIsExpanded] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const lastScrollY = useRef(0);
  const scrollPositionOnCollapse = useRef(0);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = lastScrollY.current;

    if (isExpanded && latest > previous && latest > 100) {
      setIsExpanded(false);
      scrollPositionOnCollapse.current = latest;
    } else if (
      !isExpanded &&
      latest < previous &&
      scrollPositionOnCollapse.current - latest > EXPAND_SCROLL_THRESHOLD
    ) {
      setIsExpanded(true);
    }

    lastScrollY.current = latest;
  });

  const handleCollapsedTap = () => {
    setIsExpanded(true);
    setMobileMenuOpen(true);
  };

  return (
    <>
      <div className="fixed top-6 left-1/2 z-50 -translate-x-1/2 lg:hidden">
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 250, damping: 25 }}
          className={cn(
            "flex items-center overflow-hidden",
            "bg-background/80 dark:bg-[#0a0f1e]/80",
            "backdrop-blur-2xl",
            "border border-border/50 dark:border-white/[0.07]",
            "shadow-lg",
            "h-12",
            "rounded-full",
            "transition-all duration-[450ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]",
            isExpanded
              ? "md:max-w-[680px] max-w-[600px]"
              : "max-w-12 justify-center",
          )}
        >
          {!isExpanded && (
            <div
              className="absolute inset-0 z-10 cursor-pointer rounded-full"
              onClick={handleCollapsedTap}
            />
          )}

          <div
            className={cn(
              "flex-shrink-0 flex items-center pl-4 pr-2 transition-all duration-300",
              isExpanded
                ? "opacity-100 translate-x-0 rotate-0"
                : "opacity-0 -translate-x-6 -rotate-180",
            )}
          >
            <Link href={ROUTES.HOME} onClick={(event) => event.stopPropagation()}>
              <Image
                alt={t("header.logoAlt")}
                src={SCHOLARX_HORIZONTAL_LOGO}
                width={135}
                height={24}
                style={{ width: "auto", height: "24px", objectFit: "contain" }}
              />
            </Link>
          </div>

          <div
            className={cn(
              "hidden md:flex items-center gap-0 lg:gap-1 pr-4 shrink-0 transition-all duration-300",
              isExpanded
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-5 pointer-events-none",
            )}
          >
            {navItems.map((item, index) => (
              <div
                key={item.label}
                className="shrink-0"
                style={{
                  transitionDelay: isExpanded ? `${100 + index * 50}ms` : "0ms",
                }}
              >
                <Link
                  href={item.href}
                  onClick={(event) => event.stopPropagation()}
                  className={cn(
                    "text-xs lg:text-sm font-medium px-2 lg:px-3 py-1 rounded-full transition-colors whitespace-nowrap",
                    isActive(item.href)
                      ? "text-primary bg-primary/10"
                      : "text-foreground/70 hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              </div>
            ))}
          </div>

          <div className={cn("flex items-center pr-3 md:hidden", !isExpanded && "sr-only")}>
            <HamburgerIcon
              open={mobileMenuOpen}
              onToggle={() => setMobileMenuOpen((previous) => !previous)}
            />
          </div>

          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-300",
              isExpanded ? "opacity-0 scale-[0.8]" : "opacity-100 scale-100",
            )}
            style={{ transitionDelay: isExpanded ? "0ms" : "150ms" }}
          >
            <div className="pointer-events-auto">
              <HamburgerIcon open={false} onToggle={handleCollapsedTap} />
            </div>
          </div>
        </motion.div>
      </div>

      <PremiumMobileMenu
        isLoggedIn={isLoggedIn}
        open={mobileMenuOpen}
        onOpenChange={setMobileMenuOpen}
        navItems={navItems.map(({ label, href }) => ({ label, href }))}
      />
    </>
  );
}

export default function PremiumHeaderClient({
  isLoggedIn,
}: {
  isLoggedIn: boolean;
}) {
  const pathname = usePathname();
  const navItems = useNavItems();

  const isActive = (href: string) => {
    if (href === ROUTES.HOME) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <>
      <DesktopHeader
        isLoggedIn={isLoggedIn}
        isActive={isActive}
        navItems={navItems}
      />
      <MobileCollapsibleHeader
        isLoggedIn={isLoggedIn}
        isActive={isActive}
        navItems={navItems}
      />
    </>
  );
}
