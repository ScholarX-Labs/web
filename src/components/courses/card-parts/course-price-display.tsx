import { cn } from "@/lib/utils";

interface CoursePriceDisplayProps {
  price?: number;
  currentPrice?: number;
  originalPrice?: number;
  className?: string;
}

export function CoursePriceDisplay({ price, currentPrice, originalPrice: propOriginalPrice, className }: CoursePriceDisplayProps) {
  const isPaid = (price ?? 0) > 0;
  const displayPrice = currentPrice ?? price;
  const originalPrice = propOriginalPrice ?? (currentPrice !== undefined ? price : undefined);
  const showStrikethrough = originalPrice !== undefined && originalPrice !== displayPrice;

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex items-center gap-2.5 pt-1">
        {displayPrice !== undefined && (
          <>
            {showStrikethrough && originalPrice && (
              <span className="text-xs font-semibold text-slate-500 line-through decoration-slate-500 decoration-2">
                EGP {originalPrice.toLocaleString()}
              </span>
            )}

            {isPaid ? (
              <span className="font-black text-xl tracking-tight bg-clip-text text-transparent bg-linear-to-r from-hero-blue to-[#4834d4]">
                EGP {displayPrice.toLocaleString()}
              </span>
            ) : (
              <span className="font-black text-xl tracking-tight text-emerald-600 drop-shadow-sm">
                Free
              </span>
            )}

            {showStrikethrough && originalPrice !== undefined && (
              <span
                className={cn(
                  "text-[10px] font-extrabold rounded-full px-2 py-0.5 leading-none shadow-sm",
                  !isPaid
                    ? "text-red-700 bg-red-100 border border-red-300 animate-pulse" // 100% OFF vibrant style
                    : "text-emerald-700 bg-emerald-100 border border-emerald-300"
                )}
              >
                {Math.round(((originalPrice - displayPrice) / originalPrice) * 100)}% OFF
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}