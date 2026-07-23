"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, MapPin } from "lucide-react";
import { MarketplaceLocationPicker } from "@/components/location/marketplace-location-picker";
import {
  ensureMarketplaceLocationPersisted,
  isNationwideMarketplaceLocation,
  marketplaceLocationLabel,
  type MarketplaceLocation,
} from "@/lib/marketplace-location";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  /** Compact chip for header — sits right of search */
  size?: "sm" | "md";
};

/**
 * Location switcher — tap opens marketplace picker (Nationwide / State / City).
 * Persists via localStorage + cookie hydrate on every mount.
 */
export function MarketplaceLocationIndicator({
  className,
  size = "sm",
}: Props) {
  const router = useRouter();
  const [loc, setLoc] = useState<MarketplaceLocation | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const { location, cookiesWereStale } = ensureMarketplaceLocationPersisted();
    setLoc(location);
    if (cookiesWereStale && location) {
      router.refresh();
    }
  }, [router]);

  const onSaved = useCallback(
    (next: MarketplaceLocation | null) => {
      setLoc(next);
      router.refresh();
    },
    [router],
  );

  if (!mounted) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-1 rounded-full bg-navy/[0.04]",
          size === "md" ? "h-9 w-[5.5rem]" : "h-8 w-[4.75rem]",
          className,
        )}
        aria-hidden
      />
    );
  }

  const nationwide = isNationwideMarketplaceLocation(loc);
  const label = marketplaceLocationLabel(loc);

  return (
    <>
      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className={cn(
          "pressable inline-flex max-w-[7.5rem] shrink-0 items-center gap-0.5 rounded-full border border-navy/10 bg-navy/[0.04] font-semibold text-navy hover:border-gold/40 hover:bg-gold/10 sm:max-w-[9rem]",
          size === "md" ? "h-9 gap-1 px-2.5 text-xs" : "h-8 px-2 text-[11px]",
          className,
        )}
        aria-label={`Browsing ${nationwide ? "Nigeria nationwide" : label}. Tap to change.`}
        title="Change marketplace location"
      >
        {nationwide ? null : (
          <MapPin
            className={cn(
              "shrink-0 text-gold-dark",
              size === "md" ? "h-3.5 w-3.5" : "h-3 w-3",
            )}
            aria-hidden
          />
        )}
        <span className="truncate">{label}</span>
        <ChevronDown
          className={cn(
            "shrink-0 text-navy/45",
            size === "md" ? "h-3.5 w-3.5" : "h-3 w-3",
          )}
          aria-hidden
        />
      </button>

      <MarketplaceLocationPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSaved={onSaved}
        current={loc}
        initialState={loc?.state ?? ""}
        initialCity={loc?.city ?? ""}
      />
    </>
  );
}
