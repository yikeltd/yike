"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MoreHorizontal, Shield } from "lucide-react";
import { SaveSearchButton } from "@/components/search/save-search-button";
import { MarketplaceVerticalSwitcher } from "@/components/marketplace/vertical-switcher";
import { cn } from "@/lib/utils";

export type MarketplaceCategoryHeaderProps = {
  vertical: "property" | "vehicle";
  title: string;
  /** @deprecated Marketing taglines removed — kept optional for call-site compatibility. */
  tagline?: string;
  sellHref: string;
  sellLabel: string;
  saveLabel?: string;
  saveHref?: string;
  className?: string;
};

/** Search-first category chrome — title + vertical toggle; Save / Sell / Safety in overflow. */
export function MarketplaceCategoryHeader({
  vertical,
  title,
  sellHref,
  sellLabel,
  saveLabel,
  saveHref,
  className,
}: MarketplaceCategoryHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <header className={cn("mb-3", className)}>
      <div className="flex items-center justify-between gap-3">
        <MarketplaceVerticalSwitcher active={vertical} />
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="pressable inline-flex h-9 w-9 items-center justify-center rounded-xl border border-navy/10 bg-white text-navy/70 shadow-sm hover:border-navy/20 hover:text-navy"
            aria-label="More actions"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen ? (
            <div
              role="menu"
              className="absolute right-0 z-30 mt-1.5 min-w-[11.5rem] overflow-hidden rounded-xl border border-navy/10 bg-white py-1 shadow-[0_12px_32px_rgba(3,27,78,0.12)]"
            >
              {saveHref && saveLabel ? (
                <div className="border-b border-navy/6 px-1.5 py-1" role="none">
                  <SaveSearchButton
                    label={saveLabel}
                    href={saveHref}
                    className="!w-full !justify-start !rounded-lg !bg-transparent !px-2.5 !py-2 !text-sm !font-semibold !text-navy hover:!bg-navy/[0.04]"
                  />
                </div>
              ) : null}
              <Link
                role="menuitem"
                href={sellHref}
                className="block px-3.5 py-2.5 text-sm font-semibold text-navy hover:bg-navy/[0.04]"
                onClick={() => setMenuOpen(false)}
              >
                {sellLabel}
              </Link>
              <Link
                role="menuitem"
                href="/safety"
                className="flex items-center gap-2 px-3.5 py-2.5 text-sm font-semibold text-navy/75 hover:bg-navy/[0.04]"
                onClick={() => setMenuOpen(false)}
              >
                <Shield className="h-3.5 w-3.5 text-gold" aria-hidden />
                Safety Tips
              </Link>
            </div>
          ) : null}
        </div>
      </div>
      <h1 className="mt-3 text-2xl font-bold tracking-tight text-navy sm:text-3xl">
        {title}
      </h1>
    </header>
  );
}
