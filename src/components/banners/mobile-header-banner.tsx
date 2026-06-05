"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SiteBanner } from "@/types/database";

const DISMISS_PREFIX = "yike-mobile-banner-dismissed";

function dismissKey(id: string) {
  return `${DISMISS_PREFIX}:${id}`;
}

export function MobileHeaderBanner({ banner }: { banner: SiteBanner }) {
  const [visible, setVisible] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(dismissKey(banner.id));
      if (!dismissed) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, [banner.id]);

  useEffect(() => {
    if (!visible) return;
    const t = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(t);
  }, [visible]);

  function dismiss() {
    setEntered(false);
    try {
      localStorage.setItem(dismissKey(banner.id), "1");
    } catch {
      /* ignore */
    }
    window.setTimeout(() => setVisible(false), 220);
  }

  if (!visible) return null;

  const headline = banner.title?.trim();
  const body = banner.message?.trim();
  const imageUrl = banner.image_url?.trim();
  const linkUrl = banner.link_url?.trim();

  const inner = (
    <div
      className={cn(
        "relative flex items-center gap-2.5 overflow-hidden rounded-xl border border-gold/25 bg-gradient-to-r from-navy via-[#052560] to-navy px-3 py-2.5 shadow-[0_4px_20px_rgb(3_27_78/0.25)] transition-all duration-300 ease-out",
        entered ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
      )}
    >
      <span
        className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gold"
        aria-hidden
      />
      {imageUrl && (
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg ring-1 ring-white/15">
          <Image
            src={imageUrl}
            alt=""
            fill
            className="object-cover"
            sizes="40px"
            unoptimized={
              imageUrl.startsWith("http") && !imageUrl.includes("supabase")
            }
          />
        </div>
      )}
      <div className="min-w-0 flex-1 pr-6">
        {headline && (
          <p className="truncate text-xs font-bold text-gold">{headline}</p>
        )}
        {body && (
          <p
            className={cn(
              "text-[11px] leading-snug text-white/90",
              headline ? "line-clamp-1" : "line-clamp-2"
            )}
          >
            {body}
          </p>
        )}
        {!headline && !body && imageUrl && (
          <p className="text-[11px] font-semibold text-white/90">Sponsored</p>
        )}
      </div>
      {linkUrl && (
        <ChevronRight
          className="absolute right-8 h-4 w-4 shrink-0 text-gold/80"
          aria-hidden
        />
      )}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          dismiss();
        }}
        className="pressable absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        aria-label="Dismiss banner"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );

  return (
    <div className="px-3 pb-2 lg:hidden">
      {linkUrl ? (
        <Link
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="pressable block"
        >
          {inner}
        </Link>
      ) : (
        inner
      )}
    </div>
  );
}
