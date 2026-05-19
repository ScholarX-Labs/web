"use client";

import type { IndicatorConfig } from "./stage-timeline";

interface SearchButtonLoaderProps {
  indicatorConfig: IndicatorConfig;
}

export function SearchButtonLoader({
  indicatorConfig,
}: SearchButtonLoaderProps) {
  return (
    <>
      <div
        className="shimmer-sweep absolute inset-0 rounded-xl"
        style={{ zIndex: 0 }}
      />
      <span
        className={`bg-gradient-to-r ${indicatorConfig.gradient} bg-clip-text text-transparent text-xs font-semibold relative z-10`}
      >
        {indicatorConfig.label}
      </span>
    </>
  );
}
