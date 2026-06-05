import { getAmenityLabel, getAmenityShortLabel } from "@/constants/amenities";
import { cn } from "@/lib/utils";

export function AmenityChips({
  amenities,
  max = 6,
  size = "sm",
  className,
}: {
  amenities: string[];
  max?: number;
  size?: "sm" | "md";
  className?: string;
}) {
  if (!amenities.length) return null;
  const shown = amenities.slice(0, max);
  const rest = amenities.length - shown.length;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {shown.map((id) => (
        <span
          key={id}
          className={cn(
            "rounded-full bg-surface font-semibold text-navy",
            size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
          )}
        >
          {size === "sm" ? getAmenityShortLabel(id) : getAmenityLabel(id)}
        </span>
      ))}
      {rest > 0 && (
        <span
          className={cn(
            "rounded-full bg-gold/15 font-bold text-gold-dark",
            size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
          )}
        >
          +{rest}
        </span>
      )}
    </div>
  );
}
