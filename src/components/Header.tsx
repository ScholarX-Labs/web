"use client";

import Link from "next/link";
import Scholarx_horizontal_logo from "../../public/ScholarX-Logo-horizontal-Blue-Solid-Small_ScholarX.png";
import Image from "next/image";
import SignoutButton from "@/app/auth/_components/SignoutButton";
import { User } from "lucide-react";
import MobileMenu from "@/components/MobileMenu";
import { ROUTES } from "@/lib/routes";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useEffect, useState } from "react";

interface HeaderProps {
  isLoggedIn: boolean;
}

const SCROLL_THRESHOLD = 80;

function Header({ isLoggedIn }: HeaderProps) {
  const [isHidden, setIsHidden] = useState(false);
  const { scrollY } = useScroll();
  const [headerHeightPx, setHeaderHeightPx] = useState<number>(0);

  // Read the CSS custom property --header-height and convert to pixels.
  useEffect(() => {
    function updateHeaderHeight() {
      const root = document.documentElement;
      const raw =
        getComputedStyle(root).getPropertyValue("--header-height") || "4rem";
      const el = document.createElement("div");
      el.style.position = "absolute";
      el.style.visibility = "hidden";
      el.style.height = raw.trim();
      document.body.appendChild(el);
      const px = el.offsetHeight || 0;
      document.body.removeChild(el);
      setHeaderHeightPx(px);
    }

    updateHeaderHeight();
    const mq = window.matchMedia("(min-width: 768px)");
    mq.addEventListener("change", updateHeaderHeight);
    window.addEventListener("resize", updateHeaderHeight);
    return () => {
      mq.removeEventListener("change", updateHeaderHeight);
      window.removeEventListener("resize", updateHeaderHeight);
    };
  }, []);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    const isScrollingDown = latest > previous;
    const nextHidden = isScrollingDown && latest > SCROLL_THRESHOLD;

    setIsHidden((current) => (current === nextHidden ? current : nextHidden));
  });

  return (
    <motion.header
      initial={false}
      animate={{
        y: isHidden ? -(headerHeightPx || 0) : 0,
        opacity: isHidden ? 0 : 1,
      }}
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
      className="fixed inset-x-0 top-0 z-50 w-full flex flex-row items-center justify-between px-4 lg:justify-around bg-background/95 backdrop-blur-md border-b lg:border-none will-change-transform"
      style={{
        height: "var(--header-height)",
        pointerEvents: isHidden ? "none" : "auto",
      }}
    >
      <section className="flex-1 flex justify-center lg:justify-start">
        <Link
          href={ROUTES.HOME}
          className="flex justify-center align-middle p-4 lg:p-6"
        >
          <Image
            alt="ScholarX logo"
            src={Scholarx_horizontal_logo}
            style={{
              width: "auto",
              height: "40px",
              objectFit: "contain",
            }}
            className="hover:cursor-pointer max-w-62.5"
          />
        </Link>
      </section>
      <section className="hidden lg:flex flex-2 justify-center">
        <div className="flex flex-row gap-8 justify-center items-center h-full">
          <Link
            className="text-black transition-colors duration-300 hover:text-primary"
            href={ROUTES.HOME}
          >
            Home
          </Link>
          <Link
            className="text-black transition-colors duration-300 hover:text-primary"
            href={ROUTES.ABOUT}
          >
            About us
          </Link>
          <Link
            className="text-black transition-colors duration-300 hover:text-primary"
            href={ROUTES.COURSES}
          >
            Courses
          </Link>
          <Link
            className="text-black transition-colors duration-300 hover:text-primary"
            href={ROUTES.OPPORTUNITIES}
          >
            Opportunities
          </Link>
          <Link
            className="text-black transition-colors duration-300 hover:text-primary"
            href={ROUTES.CONTACT}
          >
            Contact us
          </Link>
        </div>
      </section>
      <section className="flex-1 flex flex-row justify-end lg:justify-center items-center gap-4 lg:gap-8">
        {isLoggedIn ? (
          <>
            <Link href={ROUTES.PROFILE}>
              <User color="#000000" />
            </Link>
            <div className="hidden lg:block">
              <SignoutButton className="p-2 rounded-sm bg-primary text-white transition-colors duration-300 hover:bg-chart-5" />
            </div>
          </>
        ) : (
          <div className="hidden lg:flex flex-row items-center gap-4">
            <Link
              href={ROUTES.SIGNIN}
              className="px-4 py-2 rounded-sm text-primary border border-primary transition-colors duration-300 hover:text-primary font-medium hover:bg-primary/10"
            >
              Log in
            </Link>
            <Link
              href={ROUTES.SIGNUP}
              className="px-4 py-2 rounded-md bg-primary text-white transition-colors duration-300 hover:bg-chart-5 font-medium"
            >
              Sign up
            </Link>
          </div>
        )}
        <div className="flex items-center lg:hidden">
          <MobileMenu isLoggedIn={isLoggedIn} />
        </div>
      </section>
    </motion.header>
  );
}

export default Header;
