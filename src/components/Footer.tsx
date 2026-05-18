"use client";

import React, { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  Mail,
  Phone,
  ArrowUp,
  Globe,
  Heart,
  ExternalLink,
  Sun,
  Moon,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  ChevronRight,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

const SCHOLARX_VERTICAL_LOGO = "/biglogo.png";

const footerLinks = [
  {
    title: "Platform",
    links: [
      { name: "Home", href: ROUTES.HOME },
      { name: "About Us", href: ROUTES.ABOUT },
      { name: "Services", href: ROUTES.SERVICES },
      { name: "Courses", href: ROUTES.COURSES },
    ],
  },
  {
    title: "Support",
    links: [
      { name: "Help Center", href: "#" },
      { name: "Terms of Service", href: "#" },
      { name: "Privacy Policy", href: "#" },
      { name: "Cookie Policy", href: "#" },
    ],
  },
  {
    title: "Contact",
    links: [
      {
        name: "scholarx.eg@gmail.com",
        href: "mailto:scholarx.eg@gmail.com",
        icon: Mail,
      },
      { name: "+(20) 1012072516", href: "tel:+(20) 1012072516", icon: Phone },
    ],
  },
];

const socialLinks = [
  {
    name: "LinkedIn",
    icon: Linkedin,
    href: "https://www.linkedin.com/company/scholarx0",
    hoverColor: "hover:bg-blue-500 dark:hover:bg-blue-500",
    whiteOnHover: true,
  },
  {
    name: "Facebook",
    icon: Facebook,
    href: "https://www.facebook.com/ScholarX.eg/",
    hoverColor: "hover:bg-blue-700 dark:hover:bg-blue-600",
    whiteOnHover: true,
  },
  {
    name: "Instagram",
    icon: Instagram,
    href: "https://www.instagram.com/scholarx.eg/",
    hoverColor:
      "hover:bg-gradient-to-br hover:from-purple-500 hover:via-pink-500 hover:to-orange-400 dark:hover:from-purple-400 dark:hover:via-pink-400 dark:hover:to-orange-300",
    isGradient: true,
  },
];

const MagneticButton = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { width, height, left, top } = ref.current!.getBoundingClientRect();
    const x = clientX - (left + width / 2);
    const y = clientY - (top + height / 2);
    // Optimized 200ms feel via spring
    setPosition({ x: x * 0.2, y: y * 0.2 });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 200, damping: 20, mass: 0.1 }}
      className={cn("cursor-pointer", className)}
    >
      {children}
    </motion.div>
  );
};

const Footer = () => {
  const containerRef = useRef<HTMLElement>(null);
  const [copiedText, setCopiedText] = React.useState<string | null>(null);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCopyContact = (
    text: string,
    type: "email" | "phone",
    href: string,
  ) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedText(type);
      setTimeout(() => setCopiedText(null), 2000);
    });
    // Open the link (email or phone)
    window.location.href = href;
  };

  return (
    <footer
      ref={containerRef}
      className="relative z-50 w-full min-h-[500px] bg-white dark:bg-[#080808] border-t border-zinc-200 dark:border-zinc-800 transition-colors duration-500 block"
      style={{ display: "block", visibility: "visible", opacity: 1 }}
    >
      {/* Liquid Glass Background Accents */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-orange-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 py-16 relative z-20">
        {/* Top: Stunning Animated Title */}
        <div className="mb-12 flex justify-center items-center relative border-b border-zinc-100 dark:border-zinc-900 pb-12">
          <div className="absolute inset-0 flex justify-center">
            <motion.div
              animate={{
                opacity: [0.3, 0.6, 0.3],
                scale: [0.8, 1.1, 0.8],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="w-96 h-96 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 blur-3xl rounded-full pointer-events-none"
            />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative text-center px-8"
          >
            <motion.h2
              animate={{
                y: [0, -8, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="text-3xl md:text-4xl font-bold tracking-tight"
            >
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 dark:from-blue-400 dark:via-purple-400 dark:to-cyan-400">
                Unlock your potential
              </span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 dark:from-cyan-400 dark:via-blue-400 dark:to-purple-400">
                with ScholarX
              </span>
            </motion.h2>
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="h-1 w-24 bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 mx-auto mt-4 rounded-full origin-center"
            />
          </motion.div>
        </div>

        {/* Middle: Links & Social */}
        <div className="flex flex-wrap justify-between items-start gap-8 md:gap-12 lg:gap-16 mb-16">
          <div className="w-full md:w-auto md:max-w-xs flex flex-col items-center">
            <Link
              href={ROUTES.HOME}
              className="inline-block mb-4 transition-transform hover:scale-105 cursor-pointer"
            >
              <Image
                src={SCHOLARX_VERTICAL_LOGO}
                alt="ScholarX"
                width={160}
                height={120}
                className="dark:invert opacity-90 hover:opacity-100 transition-opacity"
              />
            </Link>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="mb-4 p-3 rounded-lg bg-gradient-to-r from-blue-50/50 to-cyan-50/50 dark:from-blue-950/20 dark:to-cyan-950/20 border border-blue-200/50 dark:border-blue-800/30 backdrop-blur-sm text-center"
            >
              <p className="text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-cyan-600 dark:from-blue-300 dark:to-cyan-400 leading-relaxed tracking-tight">
                Empowering academic success through personalized support and
                mentorship
              </p>
            </motion.div>
            <div className="flex gap-2.5 justify-center">
              {socialLinks.map((social) => (
                <MagneticButton key={social.name}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 transition-all duration-300 shadow-sm hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900",
                      social.isGradient
                        ? "hover:bg-gradient-to-br hover:from-purple-500 hover:via-pink-500 hover:to-orange-400 dark:hover:from-purple-400 dark:hover:via-pink-400 dark:hover:to-orange-300 hover:border-transparent hover:text-white dark:hover:text-white"
                        : social.hoverColor,
                      social.whiteOnHover
                        ? "hover:text-white"
                        : "hover:text-white dark:hover:text-white",
                    )}
                    aria-label={social.name}
                  >
                    <social.icon
                      size={22}
                      strokeWidth={1.5}
                      className={social.whiteOnHover ? "fill-current" : ""}
                    />
                  </a>
                </MagneticButton>
              ))}
            </div>
          </div>

          {/* Link columns with tight spacing */}
          <div className="flex gap-1 md:gap-2 lg:gap-3 flex-1">
            {footerLinks.filter(s => s.title !== "Contact").map((section, idx) => (
              <div key={section.title} className="flex-1 min-w-[150px] rounded-xl bg-gradient-to-br from-zinc-50 to-zinc-100/50 dark:from-zinc-900/50 dark:to-zinc-800/30 border border-zinc-200 dark:border-zinc-800/60 p-6 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 dark:hover:shadow-blue-500/5 hover:border-blue-300 dark:hover:border-blue-700/40">
                <h3 className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-zinc-600 to-zinc-400 dark:from-zinc-300 dark:to-zinc-500 uppercase tracking-[0.15em] mb-6 pb-3 border-b border-zinc-300 dark:border-zinc-700 transition-all duration-300 text-center">
                  {section.title}
                </h3>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="group flex items-center justify-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-300 transition-all duration-300 cursor-pointer px-3 py-2.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900 text-center w-full"
                      >
                        <span className="text-sm font-medium tracking-tight relative overflow-hidden flex-1">
                          {link.name}
                        </span>
                        <motion.div
                          initial={{ opacity: 0, x: -4 }}
                          whileHover={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3 }}
                          className="flex-shrink-0"
                        >
                          <ChevronRight
                            size={16}
                            className="text-blue-500 dark:text-blue-400 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors duration-200"
                          />
                        </motion.div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Contact section - separate container */}
            {footerLinks.filter(s => s.title === "Contact").map((section) => (
              <div key={section.title} className="flex-1 min-w-[150px] rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50/50 dark:from-blue-950/50 dark:to-cyan-900/30 border border-blue-200 dark:border-blue-800/60 p-6 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 dark:hover:shadow-blue-500/10 hover:border-blue-400 dark:hover:border-blue-600/50">
                <h3 className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-300 dark:to-cyan-400 uppercase tracking-[0.15em] mb-6 pb-3 border-b border-blue-300 dark:border-blue-700/60 transition-all duration-300 text-center">
                  {section.title}
                </h3>
                <ul className="space-y-2.5">
                  {section.links.map((link) => (
                    <li key={link.name}>
                      <motion.div
                        whileHover={{ scale: 1.05, y: -2 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 20,
                        }}
                      >
                        <button
                          onClick={() =>
                            handleCopyContact(
                              link.href.replace(/^(mailto:|tel:)/, ""),
                              link.href.includes("@") ? "email" : "phone",
                              link.href,
                            )
                          }
                          className="w-full text-center group flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/40 border border-blue-200 dark:border-blue-800/60 text-zinc-600 dark:text-zinc-400 hover:from-blue-100 hover:to-cyan-100 dark:hover:from-blue-900/50 dark:hover:to-cyan-900/50 hover:border-blue-400 dark:hover:border-blue-600 hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900 shadow-sm hover:shadow-md hover:shadow-blue-500/20 dark:hover:shadow-blue-500/10 hover:-translate-y-0.5"
                        >
                          {link.icon && (
                            <motion.div
                              whileHover={{ rotate: 12, scale: 1.15 }}
                              transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 15,
                              }}
                            >
                              {copiedText ===
                              (link.href.includes("@")
                                ? "email"
                                : "phone") ? (
                                <motion.div
                                  key="checkmark"
                                  initial={{ scale: 0, rotate: -180 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  transition={{
                                    type: "spring",
                                    stiffness: 500,
                                    damping: 25,
                                  }}
                                >
                                  <div className="text-green-500 dark:text-green-400 flex-shrink-0">
                                    <svg
                                      width="20"
                                      height="20"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                    >
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                  </div>
                                </motion.div>
                              ) : (
                                <link.icon
                                  size={20}
                                  className="text-blue-500 dark:text-blue-400 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors duration-200 flex-shrink-0"
                                />
                              )}
                            </motion.div>
                          )}
                          <div className="flex flex-col gap-0.5 min-w-0 items-center text-center">
                            <span className="text-sm font-semibold tracking-tight truncate">
                              {link.name}
                            </span>
                            {copiedText ===
                              (link.href.includes("@")
                                ? "email"
                                : "phone") && (
                              <motion.span
                                key="copied-text"
                                initial={{ opacity: 0, y: -2 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -2 }}
                                className="text-xs font-medium text-green-600 dark:text-green-400"
                              >
                                Copied!
                              </motion.span>
                            )}
                          </div>
                        </button>
                      </motion.div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: Credits & Meta */}
        <div className="flex flex-wrap justify-between items-center gap-6 md:gap-10 border-t border-zinc-100 dark:border-zinc-900 pt-12 w-full">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="relative px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border border-blue-200 dark:border-blue-800/50 shadow-lg shadow-blue-500/10 dark:shadow-blue-500/5"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400/0 via-blue-400/10 to-cyan-400/0 dark:from-blue-500/0 dark:via-blue-500/5 dark:to-cyan-500/0 animate-pulse" />
              <span className="relative text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400">
                © {new Date().getFullYear()} ScholarX Inc.
              </span>
            </motion.div>
            <div className="hidden md:block w-1 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full" />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="relative px-4 py-2 rounded-full bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/30 dark:to-pink-950/30 border border-red-200 dark:border-red-800/50 shadow-lg shadow-red-500/10 dark:shadow-red-500/5"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-400/0 via-red-400/10 to-pink-400/0 dark:from-red-500/0 dark:via-red-500/5 dark:to-pink-500/0 animate-pulse" />
              <span className="relative flex items-center gap-2.5 text-sm font-semibold">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-pink-600 dark:from-red-400 dark:to-pink-400">
                  Building with
                </span>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="flex items-center justify-center"
                >
                  <Heart
                    size={18}
                    className="text-red-500 dark:text-red-400 fill-red-500 dark:fill-red-400"
                  />
                </motion.div>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-red-600 dark:from-pink-400 dark:to-red-400">
                  since 2024
                </span>
              </span>
            </motion.div>
          </div>

          <div className="flex items-center gap-6 ml-auto">
            <div className="relative group">
              <div className="flex items-center p-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-inner opacity-50 cursor-not-allowed">
                <button
                  disabled
                  className={cn(
                    "p-2 rounded-lg transition-all cursor-not-allowed",
                    "text-zinc-400",
                  )}
                  aria-label="Light Mode (Coming Soon)"
                >
                  <Sun size={18} strokeWidth={1.5} />
                </button>
                <button
                  disabled
                  className={cn(
                    "p-2 rounded-lg transition-all cursor-not-allowed",
                    "text-zinc-400",
                  )}
                  aria-label="Dark Mode (Coming Soon)"
                >
                  <Moon size={18} strokeWidth={1.5} />
                </button>
              </div>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Upcoming Feature
              </div>
            </div>

            <button
              onClick={scrollToTop}
              className="group flex items-center gap-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-500 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900 rounded px-2 py-1"
            >
              <span>Back to Top</span>
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 group-hover:-translate-y-1.5 transition-all duration-300">
                <ArrowUp size={16} strokeWidth={2.5} />
              </div>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
