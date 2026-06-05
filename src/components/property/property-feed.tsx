import type { Property } from "@/types/database";
import { PropertyGrid } from "./property-grid";
import { Home } from "lucide-react";
import Link from "next/link";

export function PropertyFeed({
  properties,
  emptyMessage = "Beautiful homes are coming soon.",
  showCount,
  isDemo,
}: {
  properties: Property[];
  emptyMessage?: string;
  showCount?: boolean;
  isDemo?: boolean;
}) {
  if (properties.length === 0) {
    return (
      <div className="mx-3 flex flex-col items-center rounded-2xl bg-white px-8 py-16 text-center shadow-float lg:mx-0">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface">
          <Home className="h-8 w-8 text-gold" />
        </div>
        <p className="mt-4 text-base font-semibold text-navy">No homes yet</p>
        <p className="mt-2 max-w-xs text-sm text-muted">{emptyMessage}</p>
        <Link
          href="/post-property"
          className="pressable mt-6 inline-flex rounded-xl bg-gold px-6 py-3.5 text-sm font-bold text-navy shadow-glow-gold"
        >
          List a property free
        </Link>
      </div>
    );
  }

  return (
    <PropertyGrid
      properties={properties}
      showCount={showCount}
      isDemo={isDemo}
    />
  );
}
