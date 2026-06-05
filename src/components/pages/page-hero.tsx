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
  /** 0–1 — keep low so headline stays readable */
  imageOpacity?: number;
};

const VARIANTS = {
  default: "from-navy/97 via-navy/88 to-navy/55",
  dark: "from-navy-dark/97 via-navy/90 to-navy/50",
  warm: "from-navy/96 via-navy/85 to-navy/50",
  travel: "from-navy/96 via-navy/82 to-navy/48",
  premium: "from-navy/97 via-navy/86 to-navy/52",
  land: "from-navy/96 via-navy/84 to-navy/50",
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
  imageOpacity = 0.32,
}: PageHeroProps) {
  const isLocal = image.startsWith("/");

  return (
    <section
      className={cn(
        "full-bleed relative min-h-[280px] overflow-hidden lg:min-h-[340px]",
        className
      )}
    >
      <div className="absolute inset-0 bg-navy" aria-hidden />
      <Image
        src={image}
        alt=""
        fill
        priority
        className="object-cover"
        style={{ opacity: imageOpacity }}
        sizes="100vw"
        unoptimized={!isLocal}
      />
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-r",
          VARIANTS[variant]
        )}
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-navy/40 via-transparent to-transparent"
        aria-hidden
      />
      <div className="relative mx-auto flex max-w-7xl flex-col justify-end px-6 py-12 lg:px-8 lg:py-16">
        {badge && (
          <span className="mb-3 inline-flex w-fit rounded-full bg-gold/25 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-gold-light shadow-sm">
            {badge}
          </span>
        )}
        <h1 className="max-w-2xl text-3xl font-bold leading-tight tracking-tight text-white drop-shadow-sm lg:text-5xl">
          {title}
        </h1>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-white/90 drop-shadow-sm lg:text-lg">
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
