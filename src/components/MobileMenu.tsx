"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
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
import Scholarx_horizontal_logo from "../../public/ScholarX-Logo-horizontal-Blue-Solid-Small_ScholarX.png";
import { ROUTES } from "@/lib/routes";

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
              src={Scholarx_horizontal_logo}
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
                className="flex w-full items-center justify-center px-4 py-2 rounded-sm text-primary border border-primary font-medium hover:bg-primary/10"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <Link
                href={ROUTES.SIGNIN}
                onClick={() => setOpen(false)}
                className="flex w-full items-center justify-center px-4 py-2 rounded-sm text-primary border border-primary font-medium hover:bg-primary/10"
              >
                Log in
              </Link>
              <Link
                href={ROUTES.SIGNUP}
                onClick={() => setOpen(false)}
                className="flex w-full items-center justify-center px-4 py-2 rounded-md bg-primary text-white font-medium hover:bg-chart-5"
              >
                Sign up
              </Link>
            </div>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
