"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useCallback } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { usePathname } from "next/navigation";
import SignoutButton from "@/app/auth/_components/SignoutButton";
import Image from "next/image";
import Scholarx_horizontal_logo from "../../public/ScholarX-Logo-horizontal-Blue-Solid-Small_ScholarX.png";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

interface PremiumMobileMenuProps {
  isLoggedIn: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const navItems = [
  { label: "Home", href: ROUTES.HOME },
  { label: "About us", href: ROUTES.ABOUT },
  { label: "Courses", href: ROUTES.COURSES },
  { label: "Opportunities", href: ROUTES.OPPORTUNITIES },
  { label: "Contact us", href: ROUTES.CONTACT },
];

const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const menuVariants: Variants = {
  hidden: { opacity: 0, scale: 0.92, y: -16 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 350, damping: 30, mass: 0.9 },
  },
  exit: {
    opacity: 0,
    scale: 0.92,
    y: -16,
    transition: { duration: 0.15, ease: "easeInOut" },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 28,
    },
  },
};

export default function PremiumMobileMenu({ isLoggedIn, open, onOpenChange }: PremiumMobileMenuProps) {
  const pathname = usePathname();

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center pt-16"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={close}
          />
          <motion.nav
            role="navigation"
            aria-label="Mobile Navigation"
            className={cn(
              "relative w-[calc(100%-2rem)] max-w-sm",
              "bg-background/80 dark:bg-[#0a0f1e]/85 backdrop-blur-2xl",
              "border border-border/50 dark:border-white/[0.07]",
              "rounded-2xl shadow-xl overflow-hidden",
            )}
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <Link href={ROUTES.HOME} onClick={close}>
                <Image
                  alt="ScholarX logo"
                  src={Scholarx_horizontal_logo}
                  width={100}
                  height={32}
                  className="object-contain"
                />
              </Link>
              <button
                onClick={close}
                className="p-1.5 rounded-full hover:bg-muted transition-colors"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-3 pb-3 space-y-0.5">
              {navItems.map((item, i) => {
                const isActive = pathname === item.href;
                return (
                  <motion.div
                    key={item.label}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: 0.05 * i }}
                  >
                    <Link
                      href={item.href}
                      onClick={close}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium",
                        "transition-colors duration-200",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-foreground/70 hover:text-foreground hover:bg-muted/50",
                      )}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full shrink-0",
                          isActive ? "bg-primary" : "bg-transparent",
                        )}
                      />
                      {item.label}
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            <motion.div
              className="px-3 pb-3"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.05 * navItems.length }}
            >
              <div className="h-px bg-border/50 my-2" />
              {isLoggedIn ? (
                <div className="space-y-2 pt-1">
                  <Link
                    href={ROUTES.PROFILE}
                    onClick={close}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-muted/50 transition-colors duration-200"
                  >
                    <span className="h-1.5 w-1.5 rounded-full shrink-0 bg-transparent" />
                    Profile
                  </Link>
                  <SignoutButton
                    onClick={close}
                    className="flex w-full items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium text-primary border border-primary/30 hover:bg-primary/5 transition-colors duration-200"
                  />
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  <Link
                    href={ROUTES.SIGNIN}
                    onClick={close}
                    className="flex w-full items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium text-primary border border-primary/30 hover:bg-primary/5 transition-colors duration-200"
                  >
                    Log in
                  </Link>
                  <Link
                    href={ROUTES.SIGNUP}
                    onClick={close}
                    className="flex w-full items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity duration-200"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </motion.div>
          </motion.nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
