import { cn } from "@/lib/utils";

interface VisualLevelMeterProps {
  level?: "Beginner" | "Intermediate" | "Advanced";
  className?: string;
}

export function VisualLevelMeter({ level, className }: VisualLevelMeterProps) {
  if (!level) return null;

  const getMeterConfig = () => {
    switch (level) {
      case "Beginner":
        return { filled: 1, color: "bg-emerald-500", text: "text-emerald-700" };
      case "Intermediate":
        return { filled: 2, color: "bg-blue-500", text: "text-blue-700" };
      case "Advanced":
        return { filled: 3, color: "bg-rose-500", text: "text-rose-700" };
      default:
        return { filled: 1, color: "bg-slate-400", text: "text-slate-600" };
    }
  };

  const config = getMeterConfig();

  return (
    <div className={cn("flex items-center gap-1.5", className)} title={`Level: ${level}`}>
      <div className="flex items-end gap-0.5 h-3">
        {[1, 2, 3].map((bar) => (
          <div
            key={bar}
            className={cn(
              "w-1 rounded-sm transition-colors duration-300",
              bar <= config.filled ? config.color : "bg-slate-200",
              bar === 1 ? "h-1.5" : bar === 2 ? "h-2" : "h-3"
            )}
          />
        ))}
      </div>
      <span className={cn("text-[10px] font-bold uppercase tracking-wider", config.text)}>
        {level}
      </span>
    </div>
  );
}