"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import {
  Car,
  Home,
  Heart,
  HelpCircle,
  Landmark,
  KeyRound,
  Menu,
  Shield,
  Tag,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isLaunchFeatureVisible } from "@/lib/launch-mode";
import { AuthHeaderAccount } from "@/components/auth/auth-header-account";

const LINKS = [
  {
    href: "/buy",
    label: "Buy",
    icon: KeyRound,
  },
  {
    href: "/rent",
    label: "Rent",
    icon: Home,
  },
  {
    href: "/vehicles",
    label: "Vehicles",
    icon: Car,
    vehiclesOnly: true,
  },
  {
    href: "/land",
    label: "Land",
    icon: Landmark,
  },
  {
    href: "/search",
    label: "Search all",
    icon: Home,
  },
  {
    href: "/post-property",
    label: "Sell",
    icon: Tag,
  },
  {
    href: "/saved",
    label: "Saved",
    icon: Heart,
  },
  {
    href: "/safety",
    label: "Safety",
    icon: Shield,
  },
  {
    href: "/contact",
    label: "Help",
    icon: HelpCircle,
  },
] as const;

/**
 * Marketplace menu — portaled to body so header backdrop-filter
 * cannot trap position:fixed (which made the sheet float in the header).
 */
export function MarketplaceNavSheet({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md";
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const vehiclesOn = isLaunchFeatureVisible("vehicle_marketplace");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const links = LINKS.filter(
    (l) => !("vehiclesOnly" in l && l.vehiclesOnly && !vehiclesOn),
  );

  const sheet =
    open && mounted
      ? createPortal(
          <div className="fixed inset-0 z-[200]" role="presentation">
            <button
              type="button"
              className="absolute inset-0 bg-navy/45"
              aria-label="Close marketplace menu"
              onClick={() => setOpen(false)}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="absolute inset-x-0 bottom-[var(--bottom-nav-stack,0px)] max-h-[85dvh] overflow-y-auto rounded-t-[1.75rem] border border-navy/10 bg-gradient-to-b from-white to-[#f4f6fa] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_-24px_60px_-28px_rgba(3,27,78,0.55)] lg:inset-x-auto lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:w-full lg:max-w-sm lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-[1.5rem] lg:p-6 lg:pb-6"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p
                    id={titleId}
                    className="text-base font-bold tracking-tight text-navy"
                  >
                    Browse Yike
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-navy/45">
                    Vehicles, homes, and trusted shortcuts
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="pressable inline-flex h-9 w-9 items-center justify-center rounded-xl border border-navy/10 bg-white text-navy"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>

              <nav aria-label="Marketplace" className="grid gap-2">
                {links.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className="pressable flex items-center gap-3 rounded-2xl border border-navy/8 bg-white px-4 py-3.5 text-sm font-bold text-navy shadow-sm transition hover:border-gold/35 hover:bg-gold/10"
                  >
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-navy/[0.06] text-navy">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    {label}
                  </Link>
                ))}
              </nav>

              <div className="mt-4 border-t border-navy/8 pt-4">
                <AuthHeaderAccount className="w-full justify-start" />
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "pressable inline-flex shrink-0 items-center justify-center rounded-xl border border-navy/10 bg-white text-navy transition hover:border-gold/40 hover:bg-gold/10",
          size === "sm" ? "h-9 w-9" : "h-10 w-10",
          className,
        )}
        aria-label="Open marketplace menu"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Menu className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} aria-hidden />
      </button>
      {sheet}
    </>
  );
}
