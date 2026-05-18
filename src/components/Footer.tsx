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
    hoverColor: "hover:bg-blue-500 dark:hover:bg-blue-400",
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

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
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

      <div className="max-w-7xl mx-auto px-6 py-20 relative z-20">
        {/* Top: Premium Brand Statement & CTA */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10 mb-24">
          <div className="max-w-2xl">
            <h2 className="text-5xl md:text-7xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 leading-[1.05] mb-6">
              Master your future. <br />
              <span className="text-blue-600 dark:text-blue-500">
                Learning reimagined.
              </span>
            </h2>
            <p className="text-xl text-zinc-500 dark:text-zinc-400 max-w-lg">
              Unlock your potential with ScholarX. World-class education,
              personalized mentorship, and a community that cares.
            </p>
          </div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              href={ROUTES.COURSES}
              className="group relative inline-flex items-center gap-3 px-10 py-5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl font-semibold text-lg overflow-hidden transition-all hover:shadow-2xl hover:shadow-blue-500/20 cursor-pointer"
            >
              <span className="relative z-10">Start Learning Now</span>
              <ChevronRight
                size={22}
                className="relative z-10 transition-transform group-hover:translate-x-1"
              />
              <div className="absolute inset-0 bg-[#CA8A04] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
            </Link>
          </motion.div>
        </div>

        {/* Middle: Links & Social */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-20 border-t border-zinc-100 dark:border-zinc-900 pt-16">
          <div className="col-span-2 lg:col-span-2 pr-10">
            <Link
              href={ROUTES.HOME}
              className="inline-block mb-8 transition-transform hover:scale-105 cursor-pointer"
            >
              <Image
                src={SCHOLARX_VERTICAL_LOGO}
                alt="ScholarX"
                width={160}
                height={120}
                className="dark:invert opacity-90 hover:opacity-100 transition-opacity"
              />
            </Link>
            <p className="text-lg text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
              We provide the tools and resources you need to excel in the
              digital age. From coding to creative arts, find your path here.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <MagneticButton key={social.name}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 transition-all duration-300 shadow-sm",
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

          {footerLinks.map((section, idx) => (
            <div key={section.title}>
              <h3 className="text-sm font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-8">
                {section.title}
              </h3>
              <ul className="space-y-5">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="group flex items-center gap-3 text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-500 transition-colors cursor-pointer"
                    >
                      {link.icon && (
                        <link.icon
                          size={18}
                          className="text-zinc-400 dark:text-zinc-600 group-hover:text-blue-600 transition-colors"
                        />
                      )}
                      <span className="text-base font-medium tracking-tight relative overflow-hidden">
                        {link.name}
                        <span className="absolute bottom-0 left-0 w-full h-px bg-blue-600 dark:bg-blue-500 translate-x-[-101%] group-hover:translate-x-0 transition-transform duration-300" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom: Credits & Meta */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-10 border-t border-zinc-100 dark:border-zinc-900 pt-10">
          <div className="flex flex-col md:flex-row items-center gap-6">
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

          <div className="flex items-center gap-8">
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
              className="group flex items-center gap-3 text-sm font-bold text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-500 transition-colors cursor-pointer"
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
