import Link from "next/link";
import { cn } from "@/lib/utils";

/** Consistent marketplace section chrome — title, optional subtitle, optional CTA. */
export function MarketplaceSection({
  title,
  subtitle,
  href,
  linkLabel = "View all",
  children,
  className,
  band = "none",
}: {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  children: React.ReactNode;
  className?: string;
  band?: "none" | "white" | "ivory" | "sand" | "warm";
}) {
  const bandClass =
    band === "white"
      ? "home-band-white"
      : band === "ivory"
        ? "home-band-ivory"
        : band === "sand"
          ? "home-band-sand"
          : band === "warm"
            ? "home-band-warm"
            : "";

  return (
    <section className={cn("home-rail-section", bandClass, className)}>
      <div className="mb-2.5 flex items-end justify-between gap-3 lg:mb-3.5">
        <div className="min-w-0 border-l-[3px] border-gold pl-2.5 sm:pl-3">
          <h2 className="text-base font-bold tracking-tight text-navy sm:text-lg lg:text-xl">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-0.5 text-xs text-navy/50 sm:text-sm">{subtitle}</p>
          ) : null}
        </div>
        {href ? (
          <Link
            href={href}
            className="shrink-0 text-xs font-bold text-gold-dark transition-colors hover:text-navy hover:underline sm:text-sm"
          >
            {linkLabel} →
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}
