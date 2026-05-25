import Image from "next/image";
import Scholarx_vertical_logo from "../../public/ScholarX-Logo-vertical-Blue-White-Solid-Small_ScholarX.png";
import Link from "next/link";
import { Rubik } from "next/font/google";
import { Mail, Phone } from "lucide-react";
import { FaLinkedinIn, FaInstagram, FaFacebook } from "react-icons/fa6";
import { ROUTES } from "@/lib/routes";

const rubik = Rubik({ subsets: ["latin"] });

function Footer() {
  return (
    <footer className={`bg-[#333333] p-3 text-white ${rubik.className}`}>
      {/* Links section */}
      <section className="grid grid-cols-1 gap-10 md:gap-0 md:grid-cols-4 md:grid-rows-1 align-middle text-center md:text-start">
        {/* Image section  */}
        <section className="">
          <Link
            href={ROUTES.HOME}
            className="flex justify-center align-middle p-6"
          >
            <Image
              alt="ScholarX logo"
              src={Scholarx_vertical_logo}
              style={{
                width: "50%",
                minWidth: "75px",
                height: "auto",
                objectFit: "contain",
                alignSelf: "center",
              }}
              className="hover:cursor-pointer max-w-62.5"
            />
          </Link>
        </section>
        {/* Quick links section */}
        <section className="flex flex-col gap-5">
          <h3 className="text-xl">Quick links</h3>
          <div className="grid grid-cols-2 grid-rows-2 lg:flex lg:flex-col lg:justify-center gap-2">
            <Link className="w-fit mx-auto md:m-0" href={ROUTES.HOME}>
              Home
            </Link>
            <Link className="w-fit mx-auto md:m-0" href={ROUTES.ABOUT}>
              About us
            </Link>
            <Link className="w-fit mx-auto md:m-0" href={ROUTES.SERVICES}>
              Our services
            </Link>
            <Link className="w-fit mx-auto md:m-0" href={ROUTES.COURSES}>
              Courses
            </Link>
          </div>
        </section>
        {/* Contact us section */}
        <section className="flex flex-col gap-5">
          <h3 className="text-xl">Contact us</h3>
          <div className="grid grid-cols-2 lg:flex lg:flex-col gap-3 text-center md:text-left">
            <a
              href="mailto:scholarx.eg@gmail.com"
              className="inline-flex items-start justify-center md:justify-start gap-2 text-white hover:text-blue-400 hover:underline w-fit mx-auto md:mx-0"
            >
              <Mail className="text-[#3399CC] shrink-0" size={20} />
              <span className="break-all text-left">scholarx.eg@gmail.com</span>
            </a>

            <a
              href="tel:+(20) 1012072516"
              className="inline-flex items-start justify-center align-middle md:justify-start gap-2 text-white hover:text-blue-400 hover:underline w-fit mx-auto md:mx-0"
            >
              <Phone className="text-[#3399CC] shrink-0" size={20} />
              <span className="break-all text-left">+(20) 1012072516</span>
            </a>
          </div>
        </section>
        {/* Follow us section */}
        <section className="flex flex-col gap-5 max-h-min">
          <h3 className="text-xl">Follow us</h3>
          <div className="flex flex-row align-middle gap-4 justify-center md:justify-start">
            <a
              aria-label="ScholarX on LinkedIn"
              href="https://www.linkedin.com/company/scholarx0"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaLinkedinIn
                size="1.5rem"
                className="hover:text-muted text-muted-foreground transition-colors"
              />
            </a>
            <a
              aria-label="ScholarX on facebook"
              href="https://www.facebook.com/ScholarX.eg/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-muted text-muted-foreground transition-colors"
            >
              <FaFacebook size="1.5rem" />
            </a>
            <a
              aria-label="ScholarX on Instagram"
              href="https://www.instagram.com/scholarx.eg/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-muted text-muted-foreground transition-colors"
            >
              <FaInstagram size="1.5rem" />
            </a>
          </div>
        </section>
      </section>
      {/* Rights section */}
      <section className="text-center p-5 ">
        <span className="relative before:content-[''] before:block before:w-3/4 before:h-px before:bg-white before:mx-auto before:mb-2">
          © {new Date().getFullYear()} ScholarX. All rights reserved.
        </span>
      </section>
    </footer>
  );
}

export default Footer;
