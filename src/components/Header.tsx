import Link from "next/link";
import Image from "next/image";
import { getSession } from "@/lib/dal";
import SignoutButton from "@/app/auth/_components/SignoutButton";
import MobileMenu from "@/components/MobileMenu";
import { ProfilePopup } from "@/components/profile/profile-popup";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";
import { ArrowRight, LogIn, LogOut } from "lucide-react";

const SCHOLARX_HORIZONTAL_LOGO =
  "/ScholarX-Logo-horizontal-Blue-Solid-Small_ScholarX.png";

async function Header() {
  const session = await getSession();
  const isLoggedIn = !!session?.session?.id;
  return (
    <header className="sticky top-0 z-50 w-full flex flex-row items-center justify-between px-4 lg:justify-around bg-background border-b lg:border-none">
      <section className="flex-1 flex justify-center lg:justify-start">
        <Link
          href={ROUTES.HOME}
          className="flex justify-center align-middle p-4 lg:p-6"
        >
          <Image
            alt="ScholarX logo"
            src={SCHOLARX_HORIZONTAL_LOGO}
            width={180}
            height={40}
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
            href={ROUTES.AI_SEARCH}
          >
            AI Search
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
        {isLoggedIn && session?.user ? (
          <>
            <ProfilePopup
              user={{
                id: session.user.id,
                name: session.user.name,
                email: session.user.email,
                image: session.user.image ?? null,
                firstName: session.user.firstName,
                lastName: session.user.lastName,
              }}
            />
            <div className="hidden lg:block">
              <SignoutButton className="h-10 rounded-full border border-[var(--color-hero-blue)]/15 bg-white/80 px-4 text-sm font-semibold text-[var(--color-hero-heading)] shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--color-hero-blue)]/30 hover:bg-white hover:text-[var(--color-hero-blue)] hover:shadow-[0_16px_32px_-24px_rgba(51,153,204,0.75)]">
                <LogOut className="h-4 w-4" />
                Log out
              </SignoutButton>
            </div>
          </>
        ) : (
          <div className="hidden lg:flex flex-row items-center gap-4">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-10 rounded-full border border-[var(--color-hero-blue)]/15 bg-white/80 px-4 text-[13px] font-semibold text-[var(--color-hero-heading)] shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--color-hero-blue)]/30 hover:bg-[var(--color-hero-blue)]/6 hover:text-[var(--color-hero-blue)] hover:shadow-[0_16px_32px_-24px_rgba(51,153,204,0.75)]"
            >
              <Link href={ROUTES.SIGNIN}>
                <LogIn className="h-4 w-4" />
                Log in
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="h-10 rounded-full bg-[linear-gradient(135deg,var(--color-hero-blue)_0%,#2563eb_60%,var(--color-hero-orange)_100%)] px-5 text-[13px] font-semibold text-white shadow-[0_18px_36px_-18px_rgba(51,153,204,0.9)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_44px_-20px_rgba(51,153,204,1)]"
            >
              <Link href={ROUTES.SIGNUP}>
                Sign up
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
        <div className="flex items-center lg:hidden">
          <MobileMenu isLoggedIn={isLoggedIn} />
        </div>
      </section>
    </header>
  );
}

export default Header;
