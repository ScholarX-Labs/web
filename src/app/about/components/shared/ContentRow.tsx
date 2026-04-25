import Image from "next/image";
import animationStyles from "../../about-animations.module.css";
import type { AboutImage } from "../../constants";

type ContentRowProps = {
  label?: string;
  title?: string;
  content: string | string[];
  image: AboutImage;
  reversed?: boolean;
  delay?: number;
};

export default function ContentRow({
  label,
  title,
  content,
  image,
  reversed = false,
  delay = 0,
}: ContentRowProps) {
  const rowDirectionClasses = reversed
    ? "md:[&>*:first-child]:order-2 md:[&>*:last-child]:order-1"
    : "";

  const paragraphs = Array.isArray(content) ? content : [content];

  return (
    <section
      className={`${animationStyles.rowEntrance} grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-12 ${rowDirectionClasses}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex flex-col gap-4 text-center md:text-left">
        {label ? (
          <p
            className={`${animationStyles.rowLabel} m-0 text-[18px] font-semibold text-[#FF8055] md:text-[21px]`}
          >
            {label}
          </p>
        ) : null}

        {title ? (
          <h2
            className={`${animationStyles.rowTitle} m-0 text-[24px] font-semibold leading-tight text-[#2A80AA] md:text-[30px]`}
          >
            {title}
          </h2>
        ) : null}

        <div className="flex flex-col gap-4">
          {paragraphs.map((paragraph, index) => (
            <p
              key={`${image.alt}-${index}`}
              className={`${animationStyles.rowParagraph} m-0 text-[15px] leading-[1.7] text-[#7F7F7F] md:text-[17px]`}
            >
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      <div className={animationStyles.rowImage}>
        <div className="group relative w-full aspect-video overflow-hidden rounded-xl shadow-[0_10px_30px_rgba(42,128,170,0.10)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_15px_40px_rgba(42,128,170,0.15)]">
          <Image
            src={image.src}
            alt={image.alt}
            fill
            className="rounded-lg transition-transform duration-500 group-hover:scale-105 object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-[rgba(42,128,170,0.10)] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>

        {image.caption ? (
          <p className="mt-4 text-center text-[15px] font-medium text-[#2A80AA]">
            {image.caption}
          </p>
        ) : null}
      </div>
    </section>
  );
}
