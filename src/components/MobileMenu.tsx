"use client";

import Link from "next/link";
import { ArrowRight, LogIn, Menu } from "lucide-react";
import { useState } from "react";
import SignoutButton from "@/app/auth/_components/SignoutButton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ROUTES } from "@/lib/routes";

const SCHOLARX_HORIZONTAL_LOGO =
  "/ScholarX-Logo-horizontal-Blue-Solid-Small_ScholarX.png";

interface MobileMenuProps {
  isLoggedIn: boolean;
}

export default function MobileMenu({ isLoggedIn }: MobileMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="top" className="w-full p-6">
        <SheetHeader className="p-0">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <Link href={ROUTES.HOME} className="flex items-center gap-2">
            <Image
              alt="ScholarX logo"
              src={SCHOLARX_HORIZONTAL_LOGO}
              width={120}
              height={40}
              className="object-contain"
            />
          </Link>
        </SheetHeader>
        <nav className="flex flex-col gap-4 mt-8">
          <Link
            href={ROUTES.HOME}
            onClick={() => setOpen(false)}
            className="text-lg font-medium transition-colors hover:text-primary"
          >
            Home
          </Link>
          <Link
            href={ROUTES.ABOUT}
            onClick={() => setOpen(false)}
            className="text-lg font-medium transition-colors hover:text-primary"
          >
            About us
          </Link>
          <Link
            href={ROUTES.COURSES}
            onClick={() => setOpen(false)}
            className="text-lg font-medium transition-colors hover:text-primary"
          >
            Courses
          </Link>
          <Link
            href={ROUTES.OPPORTUNITIES}
            onClick={() => setOpen(false)}
            className="text-lg font-medium transition-colors hover:text-primary"
          >
            Opportunities
          </Link>
          <Link
            href={ROUTES.CONTACT}
            onClick={() => setOpen(false)}
            className="text-lg font-medium transition-colors hover:text-primary"
          >
            Contact us
          </Link>
          <hr className="my-2" />
          {isLoggedIn ? (
            <div className="flex flex-col gap-4">
              <Link
                href={ROUTES.PROFILE}
                onClick={() => setOpen(false)}
                className="text-lg font-medium transition-colors hover:text-primary"
              >
                Profile
              </Link>
              <SignoutButton
                onClick={() => setOpen(false)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-hero-blue)]/15 bg-white/80 px-4 py-3 font-semibold text-[var(--color-hero-heading)] shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--color-hero-blue)]/30 hover:bg-white hover:text-[var(--color-hero-blue)]"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <Link
                href={ROUTES.SIGNIN}
                onClick={() => setOpen(false)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-hero-blue)]/15 bg-white/80 px-4 py-3 font-semibold text-[var(--color-hero-heading)] shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--color-hero-blue)]/30 hover:bg-[var(--color-hero-blue)]/6 hover:text-[var(--color-hero-blue)]"
              >
                <LogIn className="h-4 w-4" />
                Log in
              </Link>
              <Link
                href={ROUTES.SIGNUP}
                onClick={() => setOpen(false)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,var(--color-hero-blue)_0%,#2563eb_60%,var(--color-hero-orange)_100%)] px-4 py-3 font-semibold text-white shadow-[0_18px_36px_-18px_rgba(51,153,204,0.9)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_44px_-20px_rgba(51,153,204,1)]"
              >
                Sign up
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
