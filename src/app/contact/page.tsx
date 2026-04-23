import Image from "next/image";

import ContactForm from "./_components/ContactForm";

function Page() {
  return (
    <section className="p-8 mx-auto grid w-full max-w-6xl items-start gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
      <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-6 shadow-sm backdrop-blur-sm sm:p-8 lg:p-10">
        <div className="mb-8 flex w-full justify-center">
          <Image
            src="/ScholarX-Logo-horizontal-Blue-Solid-Small_ScholarX.png"
            alt="ScholarX logo"
            width={340}
            height={72}
            className="h-auto w-56 lg:w-72"
            priority
          />
        </div>

        <p className="text-sm font-medium tracking-[0.2em] text-slate-500 uppercase">
          Contact Us
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900 sm:text-4xl">
          We would love to hear from you
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
          Share your question, feedback, or idea. Fill in the form and our team
          will review your message as soon as possible.
        </p>
      </div>

      <ContactForm />
    </section>
  );
}

export default Page;
