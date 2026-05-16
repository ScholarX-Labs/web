"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useRef, useState } from "react";
import Image from "next/image";
import { User } from "lucide-react";
import PremiumMobileMenu from "@/components/PremiumMobileMenu";
import HamburgerIcon from "@/components/HamburgerIcon";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { useScrollDirection } from "@/hooks/use-scroll-direction";
import SignoutButton from "@/app/auth/_components/SignoutButton";

const SCHOLARX_HORIZONTAL_LOGO =
  "/ScholarX-Logo-horizontal-Blue-Solid-Small_ScholarX.png";

const navItems = [
  { label: "Home", href: ROUTES.HOME },
  { label: "About us", href: ROUTES.ABOUT },
  { label: "Courses", href: ROUTES.COURSES },
  { label: "Opportunities", href: ROUTES.OPPORTUNITIES },
  { label: "Contact us", href: ROUTES.CONTACT },
];

const EXPAND_SCROLL_THRESHOLD = 50;

function NavLinks({ isActive }: { isActive: (href: string) => boolean }) {
  return (
    <>
      {navItems.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "relative px-4 py-2 text-sm font-medium rounded-full",
              "transition-colors duration-200",
              active
                ? "text-primary"
                : "text-foreground/70 hover:text-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId="nav-indicator"
                className="absolute inset-0 rounded-full bg-primary/10"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
            <span className="relative z-10">{item.label}</span>
          </Link>
        );
      })}
    </>
  );
}

function AuthButtons({ isLoggedIn }: { isLoggedIn: boolean }) {
  if (isLoggedIn) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href={ROUTES.PROFILE}
          className="p-2 rounded-full hover:bg-muted/50 transition-colors duration-200"
        >
          <User className="h-5 w-5 text-foreground/70" />
        </Link>
        <div className="hidden lg:block">
          <SignoutButton className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all duration-200 active:scale-[0.97]" />
        </div>
      </div>
    );
  }

  return (
    <div className="hidden lg:flex items-center gap-3">
      <Link
        href={ROUTES.SIGNIN}
        className="px-4 py-2 rounded-full text-sm font-medium text-foreground/70 border border-border/50 hover:border-foreground/20 hover:text-foreground transition-all duration-200 active:scale-[0.97]"
      >
        Log in
      </Link>
      <Link
        href={ROUTES.SIGNUP}
        className="px-5 py-2 rounded-full text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-all duration-200 active:scale-[0.97]"
      >
        Sign up
      </Link>
    </div>
  );
}

function DesktopHeader({ isLoggedIn, isActive }: { isLoggedIn: boolean; isActive: (href: string) => boolean }) {
  const { direction, isAtTop } = useScrollDirection(15);

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
            alt="ScholarX logo"
            src={SCHOLARX_HORIZONTAL_LOGO}
            width={180}
            height={32}
            style={{ width: "auto", height: "32px", objectFit: "contain" }}
            className="hover:cursor-pointer"
          />
        </Link>

        <nav aria-label="Main Navigation" className="flex items-center gap-1">
          <NavLinks isActive={isActive} />
        </nav>

        <div className="flex items-center gap-2">
          <AuthButtons isLoggedIn={isLoggedIn} />
        </div>
      </motion.div>
    </motion.header>
  );
}

function MobileCollapsibleHeader({ isLoggedIn, isActive }: { isLoggedIn: boolean; isActive: (href: string) => boolean }) {
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
      (scrollPositionOnCollapse.current - latest > EXPAND_SCROLL_THRESHOLD)
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
      <div className={cn("fixed top-6 left-1/2 -translate-x-1/2 z-50 lg:hidden")}>
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
          {/* Collapsed click target — entire pill */}
          {!isExpanded && (
            <div
              className="absolute inset-0 z-10 cursor-pointer rounded-full"
              onClick={handleCollapsedTap}
            />
          )}

          {/* Logo */}
          <div
            className={cn(
              "flex-shrink-0 flex items-center pl-4 pr-2 transition-all duration-300",
              isExpanded ? "opacity-100 translate-x-0 rotate-0" : "opacity-0 -translate-x-6 -rotate-180",
            )}
          >
            <Link href={ROUTES.HOME} onClick={(e) => e.stopPropagation()}>
              <Image
                alt="ScholarX"
                src={SCHOLARX_HORIZONTAL_LOGO}
                width={135}
                height={24}
                style={{ width: "auto", height: "24px", objectFit: "contain" }}
              />
            </Link>
          </div>

          {/* Nav links — shown on md+ screens where there's room */}
          <div
            className={cn(
              "hidden md:flex items-center gap-0 lg:gap-1 pr-4 shrink-0 transition-all duration-300",
              isExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-5 pointer-events-none",
            )}
          >
            {navItems.map((item, i) => (
              <div
                key={item.label}
                className="shrink-0"
                style={{ transitionDelay: isExpanded ? `${100 + i * 50}ms` : "0ms" }}
              >
                <Link
                  href={item.href}
                  onClick={(e) => e.stopPropagation()}
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

          {/* Hamburger in expanded state — hidden on md+ where nav links show */}
          <div className={cn("flex items-center pr-3 md:hidden", !isExpanded && "sr-only")}>
            <HamburgerIcon
              open={mobileMenuOpen}
              onToggle={() => setMobileMenuOpen((prev) => !prev)}
            />
          </div>

          {/* Centered Hamburger icon when collapsed */}
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-300",
              isExpanded ? "opacity-0 scale-[0.8]" : "opacity-100 scale-100",
            )}
            style={{ transitionDelay: isExpanded ? "0ms" : "150ms" }}
          >
            <div className="pointer-events-auto">
              <HamburgerIcon
                open={false}
                onToggle={handleCollapsedTap}
              />
            </div>
          </div>
        </motion.div>
      </div>

      <PremiumMobileMenu
        isLoggedIn={isLoggedIn}
        open={mobileMenuOpen}
        onOpenChange={setMobileMenuOpen}
      />
    </>
  );
}

export default function PremiumHeaderClient({ isLoggedIn }: { isLoggedIn: boolean }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === ROUTES.HOME) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <>
      <DesktopHeader isLoggedIn={isLoggedIn} isActive={isActive} />
      <MobileCollapsibleHeader isLoggedIn={isLoggedIn} isActive={isActive} />
    </>
  );
}
