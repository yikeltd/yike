import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type PageHeroProps = {
  title: string;
  subtitle: string;
  image: string;
  cta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  variant?: "default" | "dark" | "warm" | "travel" | "premium" | "land";
  badge?: string;
  className?: string;
};

const VARIANTS = {
  default: "from-navy/95 via-navy/80 to-navy/40",
  dark: "from-navy-dark/95 via-navy/85 to-transparent",
  warm: "from-amber-950/90 via-navy/70 to-transparent",
  travel: "from-violet-950/85 via-navy/60 to-transparent",
  premium: "from-slate-950/90 via-navy/75 to-transparent",
  land: "from-emerald-950/85 via-navy/65 to-transparent",
};

export function PageHero({
  title,
  subtitle,
  image,
  cta,
  secondaryCta,
  variant = "default",
  badge,
  className,
}: PageHeroProps) {
  return (
    <section
      className={cn(
        "full-bleed relative min-h-[280px] overflow-hidden lg:min-h-[360px]",
        className
      )}
    >
      <Image
        src={image}
        alt=""
        fill
        priority
        className="object-cover"
        sizes="100vw"
        unoptimized
      />
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-r",
          VARIANTS[variant]
        )}
      />
      <div className="relative mx-auto flex max-w-7xl flex-col justify-end px-6 py-12 lg:px-8 lg:py-16">
        {badge && (
          <span className="mb-3 inline-flex w-fit rounded-full bg-gold/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-gold-light backdrop-blur-sm">
            {badge}
          </span>
        )}
        <h1 className="max-w-2xl text-3xl font-bold leading-tight tracking-tight text-white lg:text-5xl">
          {title}
        </h1>
        <p className="mt-3 max-w-xl text-base text-white/85 lg:text-lg">
          {subtitle}
        </p>
        {(cta || secondaryCta) && (
          <div className="mt-6 flex flex-wrap gap-3">
            {cta && (
              <Link
                href={cta.href}
                className="pressable inline-flex min-h-[48px] items-center justify-center rounded-xl bg-gold px-6 text-sm font-bold text-navy shadow-glow-gold"
              >
                {cta.label}
              </Link>
            )}
            {secondaryCta && (
              <Link
                href={secondaryCta.href}
                className="pressable inline-flex min-h-[48px] items-center justify-center rounded-xl bg-white/15 px-6 text-sm font-bold text-white backdrop-blur-sm"
              >
                {secondaryCta.label}
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
