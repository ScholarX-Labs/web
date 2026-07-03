export type AboutImage = {
  src: string;
  alt: string;
  caption?: string;
};

export type HeroGalleryItem = {
  id: number;
  src: string;
  alt: string;
};

export type ImpactItem = {
  id: string;
  icon: string;
  alt: string;
  title: string;
  description: string;
};

export const ANIMATION_TIMINGS = {
  stagger: 100,
} as const;
