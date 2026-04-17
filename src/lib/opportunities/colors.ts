import { OpportunityType, OpportunityTypeColors } from "./types";

export const COLOR_MAP: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  "blue-500": {
    bg: "bg-blue-500/10",
    text: "text-blue-500",
    border: "border-blue-500/20",
  },
  "purple-500": {
    bg: "bg-purple-500/10",
    text: "text-purple-500",
    border: "border-purple-500/20",
  },
  "fuchsia-500": {
    bg: "bg-fuchsia-500/10",
    text: "text-fuchsia-500",
    border: "border-fuchsia-500/20",
  },
  "emerald-500": {
    bg: "bg-emerald-500/10",
    text: "text-emerald-500",
    border: "border-emerald-500/20",
  },
  "amber-500": {
    bg: "bg-amber-500/10",
    text: "text-amber-500",
    border: "border-amber-500/20",
  },
  "rose-500": {
    bg: "bg-rose-500/10",
    text: "text-rose-500",
    border: "border-rose-500/20",
  },
  "cyan-500": {
    bg: "bg-cyan-500/10",
    text: "text-cyan-500",
    border: "border-cyan-500/20",
  },
  "lime-500": {
    bg: "bg-lime-500/10",
    text: "text-lime-500",
    border: "border-lime-500/20",
  },
};

export const getBadgeColors = (subtype: OpportunityType) => {
  const colorBase = OpportunityTypeColors[subtype];
  return (
    COLOR_MAP[colorBase] || {
      bg: "bg-gray-500/10",
      text: "text-gray-500",
      border: "border-gray-500/20",
    }
  );
};
