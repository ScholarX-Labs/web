"use client";

import { useEffect, useState, useId } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import type { Container, SingleOrMultiple } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";
import { cn } from "@/lib/utils";
import { motion, useAnimation } from "framer-motion";

export function Sparkles({
  className,
  size = 1,
  minSize = null,
  density = 800,
  speed = 1,
  minSpeed = null,
  opacity = 1,
  opacitySpeed = 3,
  minOpacity = null,
  color = "#FFFFFF",
  background = "transparent",
  options = {},
}: {
  className?: string;
  size?: number;
  minSize?: number | null;
  density?: number;
  speed?: number;
  minSpeed?: number | null;
  opacity?: number;
  opacitySpeed?: number;
  minOpacity?: number | null;
  color?: string;
  background?: string;
  options?: Record<string, any>;
}) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine)
    }).then(() => {
      setIsReady(true)
    })
  }, [])

  const id = useId()

  const defaultOptions = {
    background: {
      color: {
        value: background,
      },
    },
    fullScreen: {
      enable: false,
      zIndex: 1,
    },
    fpsLimit: 120,
    particles: {
      color: {
        value: color,
      },
      move: {
        enable: true,
        direction: "none",
        speed: {
          min: minSpeed || speed / 10,
          max: speed,
        },
        straight: false,
      },
      number: {
        value: density,
      },
      opacity: {
        value: {
          min: minOpacity || opacity / 10,
          max: opacity,
        },
        animation: {
          enable: true,
          sync: false,
          speed: opacitySpeed,
        },
      },
      size: {
        value: {
          min: minSize || size / 2.5,
          max: size,
        },
      },
    },
    detectRetina: true,
  }

  return isReady && <Particles id={id} options={{ ...defaultOptions, ...options }} className={className} />
}

export interface SparklesCoreProps {
  id?: string;
  className?: string;
  background?: string;
  particleSize?: number;
  minSize?: number;
  maxSize?: number;
  speed?: number;
  particleColor?: string;
  particleDensity?: number;
}

export function SparklesCore({
  id,
  className,
  background,
  minSize,
  maxSize,
  speed,
  particleColor,
  particleDensity,
}: SparklesCoreProps) {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const controls = useAnimation();

  const particlesLoaded = async (container?: Container) => {
    if (container) {
      controls.start({
        opacity: 1,
        transition: { duration: 1 },
      });
    }
  };

  const generatedId = useId();

  return (
    <motion.div animate={controls} className={cn("opacity-0", className)}>
      {init && (
        <Particles
          id={id || generatedId}
          className={cn("h-full w-full")}
          particlesLoaded={particlesLoaded}
          options={{
            background: {
              color: { value: background || "#0d47a1" },
            },
            fullScreen: { enable: false, zIndex: 1 },
            fpsLimit: 120,
            interactivity: {
              events: {
                onClick: { enable: true, mode: "push" },
                onHover: { enable: false, mode: "repulse" },
                resize: true as any,
              },
              modes: {
                push: { quantity: 4 },
                repulse: { distance: 200, duration: 0.4 },
              },
            },
            particles: {
              color: {
                value: particleColor || "#ffffff",
              },
              move: {
                enable: true,
                speed: { min: 0.1, max: 1 },
                direction: "none",
                outModes: { default: "out" },
              },
              number: {
                density: { enable: true, width: 400, height: 400 },
                limit: { mode: "delete", value: 0 },
                value: particleDensity || 120,
              },
              opacity: {
                value: { min: 0.1, max: 1 },
                animation: {
                  count: 0,
                  enable: true,
                  speed: speed || 4,
                  sync: false,
                  startValue: "random",
                },
              },
              shape: { type: "circle" },
              size: {
                value: { min: minSize || 1, max: maxSize || 3 },
              },
            },
            detectRetina: true,
          }}
        />
      )}
    </motion.div>
  );
}
