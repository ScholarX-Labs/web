import Image from "next/image";
import { getTranslations } from "next-intl/server";

import ContactForm from "./_components/ContactForm";

export const revalidate = 86400;
export const dynamic = "force-static";

async function Page() {
  const [t, tCommon] = await Promise.all([
    getTranslations("contact"),
    getTranslations("common"),
  ]);

  return (
    <section className="p-8 mx-auto grid w-full max-w-6xl items-start gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
      <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-6 shadow-sm backdrop-blur-sm sm:p-8 lg:p-10">
        <div className="mb-8 flex w-full justify-center">
          <Image
            src="/ScholarX-Logo-horizontal-Blue-Solid-Small_ScholarX.png"
            alt={tCommon("header.logoAlt")}
            width={340}
            height={72}
            className="h-auto w-56 lg:w-72"
            priority
          />
        </div>

        <p className="text-sm font-medium tracking-[0.2em] text-slate-500 uppercase">
          {t("hero.eyebrow")}
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900 sm:text-4xl">
          {t("hero.title")}
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
          {t("hero.description")}
        </p>
      </div>

      <ContactForm />
    </section>
  );
}

export default Page;
