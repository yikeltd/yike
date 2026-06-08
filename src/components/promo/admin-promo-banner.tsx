import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { SiteBanner } from "@/types/database";
import { cn } from "@/lib/utils";

export type AdminPromoVariant = "inline" | "card" | "sticky" | "hero";

type Props = {
  banner: SiteBanner;
  variant?: AdminPromoVariant;
  className?: string;
};

export function AdminPromoBanner({ banner, variant = "inline", className }: Props) {
  const title = banner.title?.trim();
  const subtitle = banner.subtitle?.trim() || banner.message?.trim() || "";
  const cta = banner.cta_text?.trim() || "Learn more";
  const href = banner.link_url?.trim() || "/";

  if (!title && !subtitle) return null;

  if (variant === "sticky") {
    return (
      <div
        className={cn(
          "fixed inset-x-0 bottom-[var(--bottom-nav-stack)] z-40 px-3 lg:hidden",
          className
        )}
      >
        <Link
          href={href}
          className="flex items-center justify-between gap-3 rounded-xl border border-navy/10 bg-white/95 px-3 py-2.5 shadow-float backdrop-blur-sm"
        >
          <div className="min-w-0">
            {title ? (
              <p className="truncate text-xs font-semibold text-navy">{title}</p>
            ) : null}
            <p className="truncate text-[11px] text-muted">{cta}</p>
          </div>
          <Sparkles className="h-4 w-4 shrink-0 text-gold" />
        </Link>
      </div>
    );
  }

  if (variant === "hero") {
    return (
      <section
        className={cn(
          "rounded-2xl border border-navy/8 bg-gradient-to-br from-white to-surface p-5 shadow-sm",
          className
        )}
      >
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
          <div>
            {title ? (
              <h2 className="text-base font-bold leading-snug text-navy lg:text-lg">{title}</h2>
            ) : null}
            {subtitle ? (
              <p className="mt-2 text-sm text-muted leading-relaxed">{subtitle}</p>
            ) : null}
            <Link
              href={href}
              className="mt-4 inline-flex rounded-xl border border-navy/15 bg-navy px-4 py-2 text-sm font-semibold text-gold"
            >
              {cta}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn(
        "rounded-2xl border border-navy/8 bg-white p-4 shadow-sm",
        variant === "card" && "shadow-float",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
        <div className="min-w-0 flex-1">
          {title ? (
            <h2 className="text-sm font-bold text-navy lg:text-base">{title}</h2>
          ) : null}
          {subtitle ? (
            <p className="mt-1 text-sm text-muted leading-relaxed">{subtitle}</p>
          ) : null}
          <Link
            href={href}
            className="mt-3 inline-flex rounded-lg border border-navy/15 px-3 py-1.5 text-xs font-semibold text-navy lg:text-sm"
          >
            {cta}
          </Link>
        </div>
      </div>
    </section>
  );
}
