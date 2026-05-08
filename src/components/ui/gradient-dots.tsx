'use client';

/** @usage Full-screen animated backgrounds, hero sections, decorative overlays */
import { motion } from 'framer-motion';

type GradientDotsProps = React.ComponentProps<typeof motion.div> & {
  dotSize?: number;
  spacing?: number;
  duration?: number;
  colorCycleDuration?: number;
  backgroundColor?: string;
};

export function GradientDots({
  dotSize = 8,
  spacing = 10,
  duration = 30,
  colorCycleDuration = 6,
  backgroundColor = 'var(--background)',
  className,
  ...props
}: GradientDotsProps) {
  const hexSpacing = spacing * 1.732;

  return (
    <motion.div
      className={`absolute inset-0 ${className}`}
      style={{
        backgroundColor,
        backgroundImage: [
          `radial-gradient(circle at 50% 50%, transparent 1.5px, ${backgroundColor} 0 ${dotSize}px, transparent ${dotSize}px)`,
          `radial-gradient(circle at 50% 50%, transparent 1.5px, ${backgroundColor} 0 ${dotSize}px, transparent ${dotSize}px)`,
          'radial-gradient(circle at 50% 50%, #f00, transparent 60%)',
          'radial-gradient(circle at 50% 50%, #ff0, transparent 60%)',
          'radial-gradient(circle at 50% 50%, #0f0, transparent 60%)',
          'radial-gradient(ellipse at 50% 50%, #00f, transparent 60%)',
        ].join(', '),
        backgroundSize: [
          `${spacing}px ${hexSpacing}px`,
          `${spacing}px ${hexSpacing}px`,
          '200% 200%',
          '200% 200%',
          '200% 200%',
          `200% ${hexSpacing}px`,
        ].join(', '),
        backgroundPosition: [
          `0px 0px`,
          `${spacing / 2}px ${hexSpacing / 2}px`,
          '0% 0%',
          '0% 0%',
          '0% 0%',
          `0% 0px`,
        ].join(', '),
      }}
      animate={{
        backgroundPosition: [
          `0px 0px, ${spacing / 2}px ${hexSpacing / 2}px, 800% 400%, 1000% -400%, -1200% -600%, 400% ${hexSpacing}px`,
          `0px 0px, ${spacing / 2}px ${hexSpacing / 2}px, 0% 0%, 0% 0%, 0% 0%, 0% 0%`,
        ],
        filter: ['hue-rotate(0deg)', 'hue-rotate(360deg)'],
      }}
      transition={{
        backgroundPosition: {
          duration,
          ease: 'linear',
          repeat: Number.POSITIVE_INFINITY,
        },
        filter: {
          duration: colorCycleDuration,
          ease: 'linear',
          repeat: Number.POSITIVE_INFINITY,
        },
      }}
      {...props}
    />
  );
}
