import Image from "next/image";
import animationStyles from "../about-animations.module.css";
import type { AboutImage } from "../constants";

type VisionSectionProps = {
  image: AboutImage;
  text: string;
};

export default function VisionSection({ image, text }: VisionSectionProps) {
  return (
    <section className="mx-auto max-w-300 px-4 py-12 md:px-5 md:py-20">
      <div
        className={`${animationStyles.visionFade} flex flex-col items-center justify-center gap-8 text-center md:flex-row md:gap-12 md:text-left`}
      >
        <div className={animationStyles.visionImage}>
          <Image
            src={image.src}
            alt={image.alt}
            width={450}
            height={300}
            className="w-full max-w-112.5 transition-all duration-300 hover:scale-105 hover:-rotate-2 drop-shadow-[0_10px_30px_rgba(42,128,170,0.15)]"
          />
        </div>

        <p
          className={`${animationStyles.visionText} max-w-137.5 text-[16px] leading-relaxed text-[#7F7F7F]`}
        >
          {text}
        </p>
      </div>

      <div
        className={`${animationStyles.visionUnderline} mx-auto mt-8 h-1 rounded bg-linear-to-r from-[#2A80AA] to-[#77BBDD]`}
        style={{ width: "100px" }}
      />
    </section>
  );
}
