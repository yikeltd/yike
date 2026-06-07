import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import type { SiteBanner } from "@/types/database";
import { DEFAULT_VERIFICATION_BANNER } from "@/constants/siteBanners";
import { cn } from "@/lib/utils";

export type VerificationPromoVariant = "inline" | "card" | "sticky" | "hero";

type Props = {
  banner?: SiteBanner | null;
  variant?: VerificationPromoVariant;
  className?: string;
};

export function VerificationPromoBanner({ banner, variant = "inline", className }: Props) {
  const title = banner?.title?.trim() || DEFAULT_VERIFICATION_BANNER.title;
  const subtitle =
    banner?.subtitle?.trim() || banner?.message?.trim() || DEFAULT_VERIFICATION_BANNER.subtitle;
  const cta = banner?.cta_text?.trim() || DEFAULT_VERIFICATION_BANNER.ctaText;
  const href = banner?.link_url?.trim() || DEFAULT_VERIFICATION_BANNER.linkUrl;

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
          className="flex items-center justify-between gap-3 rounded-2xl border border-gold/30 bg-navy px-4 py-3 shadow-float"
        >
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-gold">{title}</p>
            <p className="truncate text-[11px] text-white/80">{cta}</p>
          </div>
          <ShieldCheck className="h-5 w-5 shrink-0 text-gold" />
        </Link>
      </div>
    );
  }

  if (variant === "hero") {
    return (
      <section
        className={cn(
          "rounded-2xl border border-gold/25 bg-gradient-to-br from-navy to-navy/90 p-5 text-white",
          className
        )}
      >
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-gold" />
          <div>
            <h2 className="text-base font-bold leading-snug lg:text-lg">{title}</h2>
            <p className="mt-2 text-sm text-white/85 leading-relaxed">{subtitle}</p>
            <Link
              href={href}
              className="mt-4 inline-flex rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-navy"
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
        "rounded-2xl border border-gold/20 bg-gold/5 p-4",
        variant === "card" && "shadow-sm",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-navy lg:text-base">{title}</h2>
          <p className="mt-1 text-sm text-muted leading-relaxed">{subtitle}</p>
          <Link
            href={href}
            className="mt-3 inline-flex rounded-xl bg-navy px-3 py-2 text-xs font-bold text-gold lg:text-sm"
          >
            {cta}
          </Link>
        </div>
      </div>
    </section>
  );
}
