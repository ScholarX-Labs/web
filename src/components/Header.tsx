import Link from "next/link";
import Scholarx_horizontal_logo from "../../public/ScholarX-Logo-horizontal-Blue-Solid-Small_ScholarX.png";
import Image from "next/image";
import { getSession } from "@/lib/dal";
import SignoutButton from "@/app/auth/_components/SignoutButton";
import { User } from "lucide-react";
import MobileMenu from "@/components/MobileMenu";

async function Header() {
  const session = await getSession();
  const isLoggedIn = !!session?.session?.id;
  return (
    <header className="sticky top-0 z-50 w-full flex flex-row items-center justify-between px-4 lg:justify-around bg-background border-b lg:border-none">
      <section className="flex-1 flex justify-center lg:justify-start">
        <Link href="/" className="flex justify-center align-middle p-4 lg:p-6">
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
            href="/"
          >
            Home
          </Link>
          <Link
            className="text-black transition-colors duration-300 hover:text-primary"
            href="/about"
          >
            About us
          </Link>
          <Link
            className="text-black transition-colors duration-300 hover:text-primary"
            href="/courses"
          >
            Courses
          </Link>
          <Link
            className="text-black transition-colors duration-300 hover:text-primary"
            href="/opportunities"
          >
            Opportunities
          </Link>
          <Link
            className="text-black transition-colors duration-300 hover:text-primary"
            href="/contact"
          >
            Contact us
          </Link>
        </div>
      </section>
      <section className="flex-1 flex flex-row justify-end lg:justify-center items-center gap-4 lg:gap-8">
        {isLoggedIn ? (
          <>
            <Link href="/profile">
              <User color="#000000" />
            </Link>
            <div className="hidden lg:block">
              <SignoutButton className="p-2 rounded-sm bg-primary text-white transition-colors duration-300 hover:bg-chart-5" />
            </div>
          </>
        ) : (
          <div className="hidden lg:flex flex-row items-center gap-4">
            <Link
              href="/auth/signin"
              className="px-4 py-2 rounded-sm text-primary border border-primary transition-colors duration-300 hover:text-primary font-medium hover:bg-primary/10"
            >
              Log in
            </Link>
            <Link
              href="/auth/signup"
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
    </header>
  );
}

export default Header;
