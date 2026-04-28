import { ANIMATION_TIMINGS } from "../constants";
import type { ImpactItem } from "../constants";
import animationStyles from "../about-animations.module.css";
import ImpactCard from "./shared/ImpactCard";

type ImpactSectionProps = {
  title: string;
  items: ImpactItem[];
};

export default function ImpactSection({ title, items }: ImpactSectionProps) {
  return (
    <section className="mx-auto max-w-300 px-4 py-12 text-center md:px-5 md:py-20">
      <h2
        className={`${animationStyles.impactTitle} mb-5 text-[24px] font-semibold text-[#77BBDD] md:text-[30px]`}
      >
        {title}
      </h2>
      <div
        className={`${animationStyles.impactUnderline} mx-auto mb-10 h-1 rounded bg-linear-to-r from-[#77BBDD] to-[#2A80AA] md:mb-16`}
      />

      <div className="mx-auto mb-8 grid max-w-275 grid-cols-1 gap-6 md:grid-cols-3">
        {items.slice(0, 3).map((item, index) => (
          <ImpactCard
            key={item.id}
            icon={item.icon}
            alt={item.alt}
            title={item.title}
            description={item.description}
            delay={index * ANIMATION_TIMINGS.stagger}
          />
        ))}
      </div>

      <div className="mx-auto flex max-w-200 flex-wrap justify-center gap-6">
        {items.slice(3).map((item, index) => (
          <div key={item.id} className="w-full md:max-w-87.5">
            <ImpactCard
              icon={item.icon}
              alt={item.alt}
              title={item.title}
              description={item.description}
              delay={(index + 3) * ANIMATION_TIMINGS.stagger}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
