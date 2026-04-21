import Image from "next/image";
import animationStyles from "../about-animations.module.css";
import type { HeroGalleryItem } from "../constants";

type HeroSectionProps = {
  label: string;
  title: string;
  gallery: readonly HeroGalleryItem[];
};

export default function HeroSection({
  label,
  title,
  gallery,
}: HeroSectionProps) {
  return (
    <section className="relative mb-12 text-center md:mb-20">
      <div className="mb-10 md:mb-16">
        <p
          className={`${animationStyles.heroLabel} mb-4 text-base font-semibold text-[#77BBDD] md:text-[22px]`}
        >
          {label}
        </p>
        <h1
          className={`${animationStyles.heroTitle} mx-auto max-w-4xl bg-linear-to-r from-[#2A80AA] to-[#77BBDD] bg-clip-text px-3 text-[30px] font-semibold leading-tight text-transparent md:text-[49px]`}
        >
          {title}
        </h1>
      </div>

      <div className="mx-auto grid max-w-300 grid-cols-1 gap-8 px-3 md:grid-cols-3 md:gap-8">
        {gallery.map((image, index) => {
          const middleIndex = Math.floor(gallery.length / 2);
          const isMiddle = index === middleIndex;
          const animationClass = isMiddle
            ? animationStyles.heroImageFloat
            : animationStyles.heroImage;

          return (
            <div
              key={image.id}
              className={`${animationClass} group relative w-full aspect-video overflow-hidden rounded-xl shadow-[0_10px_30px_rgba(42,128,170,0.15)] transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-[0_20px_50px_rgba(42,128,170,0.25)]`}
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-105"
                priority={index === 0}
              />
              <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-[rgba(42,128,170,0.15)] to-[rgba(119,187,221,0.10)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>
          );
        })}
      </div>
    </section>
  );
}
