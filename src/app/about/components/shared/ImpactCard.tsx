import Image from "next/image";
import animationStyles from "../../about-animations.module.css";

type ImpactCardProps = {
  icon: string;
  alt: string;
  title: string;
  description: string;
  delay?: number;
};

export default function ImpactCard({
  icon,
  alt,
  title,
  description,
  delay = 0,
}: ImpactCardProps) {
  return (
    <article
      className={`${animationStyles.cardEntrance} group flex translate-y-6 flex-col items-center px-4 py-7 text-center transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02]`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className={`${animationStyles.iconPulse} mb-6 flex h-16.25 w-16.25 items-center justify-center rounded-full bg-linear-to-br from-[#77BBDD] to-[#5AAACC]`}
      >
        <Image
          src={icon}
          alt={alt}
          width={65}
          height={65}
          className="object-contain transition-transform duration-300 group-hover:scale-110"
        />
      </div>
      <h3 className="mb-4 text-[20px] font-semibold leading-snug text-[#77BBDD] transition-colors duration-200 group-hover:text-[#2A80AA]">
        {title}
      </h3>
      <p className="mx-auto max-w-87.5 text-[16px] leading-relaxed text-[#7F7F7F] transition-colors duration-200 group-hover:text-[#666666]">
        {description}
      </p>
    </article>
  );
}
