"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { LoadingStage, type OrbConfig } from "./stage-timeline";
import {
  orbContainerVariants,
  orbPulseVariants,
  orbMorphVariants,
  sparkleBurstVariants,
} from "@/lib/ai-search-animations";

interface AIThinkingOrbProps {
  orbConfig: OrbConfig;
}

function ThinkingOrb({ gradient }: { gradient: string }) {
  return (
    <motion.div
      key="thinking"
      variants={orbContainerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <motion.div
        variants={orbPulseVariants}
        animate="animate"
        className={`h-16 w-16 rounded-full bg-gradient-to-br ${gradient}`}
        style={{ boxShadow: "0 0 40px rgba(56, 189, 248, 0.3)" }}
      />
    </motion.div>
  );
}

function AnalyzingOrb({ gradient }: { gradient: string }) {
  return (
    <motion.div
      key="analyzing"
      variants={orbContainerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="relative h-16 w-16"
    >
      <div
        className={`absolute inset-0 rounded-full bg-gradient-to-br ${gradient} animate-orbit`}
        style={{ width: 12, height: 12, left: "calc(50% - 6px)", top: -6 }}
      />
      <div
        className={`absolute inset-0 rounded-full bg-gradient-to-br ${gradient} animate-orbit-reverse`}
        style={{ width: 12, height: 12, left: "calc(50% - 6px)", bottom: -6, top: "auto" }}
      />
      <div className="absolute inset-0 m-auto w-2 h-2 rounded-full bg-foreground/20" />
    </motion.div>
  );
}

function RemodelingOrb({ orbConfig }: { orbConfig: OrbConfig }) {
  return (
    <motion.div
      key="remodeling"
      variants={orbContainerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <motion.div
        variants={orbMorphVariants}
        animate="animate"
        className={`w-20 h-14 bg-gradient-to-br ${orbConfig.gradient}`}
        style={{ boxShadow: `0 0 40px ${orbConfig.glowColor}` }}
      />
    </motion.div>
  );
}

function CuratingOrb({ gradient }: { gradient: string }) {
  return (
    <motion.div
      key="curating"
      variants={orbContainerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div
        className={`h-12 w-12 bg-gradient-to-br ${gradient} animate-spin-compact`}
        style={{
          clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
          boxShadow: "0 0 30px rgba(245, 158, 11, 0.3)",
        }}
      />
    </motion.div>
  );
}

function DoneOrb() {
  const particles = Array.from({ length: 8 }, (_, i) => ({
    angle: i * 45,
    key: `particle-${i}`,
  }));

  return (
    <motion.div
      key="done"
      variants={orbContainerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="relative h-16 w-16"
    >
      <motion.div
        className="absolute inset-0 m-auto h-4 w-4 rounded-full bg-white"
        initial={{ scale: 1, opacity: 1 }}
        animate={{ scale: 0, opacity: 0 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      />
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.key}
            className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-white"
            variants={sparkleBurstVariants}
            initial="initial"
            animate="animate"
            custom={p.angle}
            style={{ x: "-50%", y: "-50%" }}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}

export function AIThinkingOrb({ orbConfig }: AIThinkingOrbProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div className="flex items-center justify-center h-32">
        <div
          className={`h-16 w-16 rounded-full bg-gradient-to-br ${orbConfig.gradient}`}
          style={{ boxShadow: `0 0 30px ${orbConfig.glowColor}` }}
        />
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center h-32 w-full">
      <AnimatePresence mode="wait">
        {orbConfig.stage === LoadingStage.THINKING && (
          <ThinkingOrb gradient={orbConfig.gradient} />
        )}
        {orbConfig.stage === LoadingStage.ANALYZING && (
          <AnalyzingOrb gradient={orbConfig.gradient} />
        )}
        {orbConfig.stage === LoadingStage.REMODELING && (
          <RemodelingOrb orbConfig={orbConfig} />
        )}
        {orbConfig.stage === LoadingStage.CURATING && (
          <CuratingOrb gradient={orbConfig.gradient} />
        )}
        {orbConfig.stage === LoadingStage.DONE && <DoneOrb />}
      </AnimatePresence>

      <motion.div
        className="absolute inset-0 rounded-full blur-3xl opacity-30 pointer-events-none"
        animate={{
          background: `radial-gradient(circle, ${orbConfig.glowColor}, transparent 70%)`,
        }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      />
    </div>
  );
}
