import Link from "next/link";
import {
  FOUNDER,
  FOUNDER_CLOSING,
  FOUNDER_SECTIONS,
} from "./founder-story-content";
import { CtaBanner } from "@/components/pages/cta-banner";
import { cn } from "@/lib/utils";

function FounderPortrait() {
  return (
    <div
      className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-3xl bg-gradient-to-br from-navy via-navy-mid to-navy-dark shadow-float-lg ring-1 ring-gold/25"
      aria-label="Odogwu Stankings — founder portrait placeholder"
    >
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgb(228_181_71/0.18),transparent_55%)]"
        aria-hidden
      />
      <div className="absolute inset-0 flex flex-col items-center justify-end p-8 text-center">
        <span className="text-6xl font-bold tracking-tight text-white/15">OS</span>
        <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.22em] text-gold-light">
          Founder portrait
        </p>
        <p className="mt-1 text-xs text-white/50">Photo coming soon</p>
      </div>
    </div>
  );
}

function TimelineSection({
  section,
  index,
}: {
  section: (typeof FOUNDER_SECTIONS)[number];
  index: number;
}) {
  const isEven = index % 2 === 0;

  return (
    <article
      id={section.id}
      className={cn(
        "animate-fade-up scroll-mt-24 border-t border-surface py-12 lg:py-16",
        "grid gap-8 lg:grid-cols-12 lg:gap-12"
      )}
    >
      <div className={cn("lg:col-span-4", !isEven && "lg:order-2")}>
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gold-dark">
          {section.label}
        </p>
        <h2 className="mt-2 text-2xl font-bold leading-tight text-foreground lg:text-3xl">
          {section.title}
        </h2>
        <div className="mt-4 hidden h-px w-16 bg-gold lg:block" aria-hidden />
      </div>

      <div className={cn("space-y-4 lg:col-span-8", !isEven && "lg:order-1")}>
        {section.paragraphs.map((p) => (
          <p key={p.slice(0, 40)} className="text-base leading-[1.75] text-muted lg:text-lg">
            {p}
          </p>
        ))}
        {"quote" in section && section.quote && (
          <blockquote className="mt-6 border-l-[3px] border-gold bg-gold/5 px-5 py-4">
            <p className="text-lg font-semibold leading-snug text-navy dark:text-foreground">
              &ldquo;{section.quote}&rdquo;
            </p>
          </blockquote>
        )}
      </div>
    </article>
  );
}

export function FounderProfilePage() {
  return (
    <div className="founder-profile pb-4">
      {/* Hero */}
      <section className="full-bleed relative overflow-hidden border-b border-gold/15 bg-navy text-white">
        <div
          className="pointer-events-none absolute -right-24 top-0 h-80 w-80 rounded-full bg-gold/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-white/5 blur-3xl"
          aria-hidden
        />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-14 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:py-20">
          <div className="order-2 lg:order-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-gold-light">
              Founder story
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight lg:text-5xl xl:text-6xl">
              {FOUNDER.name}
            </h1>
            <p className="mt-2 text-lg font-semibold text-gold lg:text-xl">
              Founder of Yike
            </p>
            <p className="mt-6 max-w-xl text-xl font-medium leading-relaxed text-white/90 lg:text-2xl">
              &ldquo;{FOUNDER.tagline}&rdquo;
            </p>
            <p className="mt-6 max-w-lg text-sm leading-relaxed text-white/75 lg:text-base">
              Nigerian tech entrepreneur · PropTech founder · builder of systems
              that help people find real opportunities — from Aba streets to
              Dubai discipline to Yike.ng.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/"
                className="pressable inline-flex min-h-[44px] items-center rounded-xl bg-gold px-5 text-sm font-bold text-navy shadow-glow-gold"
              >
                See Yike
              </Link>
              <Link
                href="/about"
                className="pressable inline-flex min-h-[44px] items-center rounded-xl border border-white/20 bg-white/10 px-5 text-sm font-bold text-white backdrop-blur-sm"
              >
                About the mission
              </Link>
            </div>
          </div>
          <div className="order-1 animate-image-reveal lg:order-2">
            <FounderPortrait />
          </div>
        </div>
      </section>

      {/* Documentary intro */}
      <section className="mx-auto max-w-3xl px-6 py-12 text-center lg:px-8 lg:py-16">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gold-dark">
          A Nigerian builder story
        </p>
        <p className="mt-4 text-lg leading-[1.8] text-muted lg:text-xl">
          This is not a pitch for sympathy. It is a record of resilience,
          discipline, and deliberate building — from farm mornings and mason
          wages to computer labs, Dubai systems, Stankings Autos, and a full-time
          commitment to technology through Yike.
        </p>
      </section>

      {/* Timeline nav */}
      <nav
        aria-label="Founder story chapters"
        className="sticky top-14 z-20 border-y border-surface bg-elevated/95 backdrop-blur-md lg:top-16"
      >
        <div className="hide-scrollbar mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 lg:px-8">
          {FOUNDER_SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="pressable shrink-0 rounded-full bg-surface px-3 py-1.5 text-xs font-bold text-muted transition-colors hover:bg-gold/15 hover:text-navy"
            >
              {s.label}
            </a>
          ))}
        </div>
      </nav>

      {/* Story sections */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {FOUNDER_SECTIONS.map((section, i) => (
          <TimelineSection key={section.id} section={section} index={i} />
        ))}
      </div>

      {/* Closing statement */}
      <section className="full-bleed border-t border-gold/20 bg-gradient-to-b from-gold/10 to-transparent px-6 py-14 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gold-dark">
            Founder statement
          </p>
          <p className="mt-6 text-2xl font-bold leading-snug text-navy lg:text-3xl">
            {FOUNDER_CLOSING.statement}
          </p>
          <p className="mt-6 text-sm leading-relaxed text-muted lg:text-base">
            Background does not define destiny. Systems do. Trust does. Consistent
            work does. Yike exists because better housing discovery is not a
            luxury — it is a necessity for millions of Nigerians searching for
            stability, growth, and a fair shot.
          </p>
        </div>
      </section>

      <CtaBanner
        title="Real homes. Real trust. Built in Nigeria."
        body="Explore verified listings, contact agents on WhatsApp, and experience housing discovery designed for how Nigerians actually live."
        primary={FOUNDER_CLOSING.cta.primary}
        secondary={FOUNDER_CLOSING.cta.secondary}
      />
    </div>
  );
}
