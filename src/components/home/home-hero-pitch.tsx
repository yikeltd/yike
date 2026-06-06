import Link from "next/link";
import { HOME_HERO_HEADLINE, HOME_HERO_SUBLINE } from "@/lib/constants";

export function HomeHeroPitch() {
  return (
    <section className="border-b border-navy/10 bg-gradient-to-b from-navy/[0.09] via-navy/[0.04] to-transparent px-3 py-5 lg:px-6 xl:px-8">
      <div className="mx-auto max-w-7xl">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-dark">
          Verified listings · WhatsApp contact
        </p>
        <h1 className="mt-2 text-2xl font-bold leading-tight text-navy lg:text-3xl">
          {HOME_HERO_HEADLINE}
        </h1>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-navy/70 lg:text-base dark:text-muted">
          {HOME_HERO_SUBLINE}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/browse"
            className="pressable rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-navy shadow-glow-gold"
          >
            Swipe homes
          </Link>
          <Link
            href="/search?city=Aba"
            className="pressable rounded-xl border border-navy/15 bg-white/90 px-4 py-2.5 text-sm font-semibold text-navy dark:border-white/10 dark:bg-elevated"
          >
            Search Aba
          </Link>
        </div>
      </div>
    </section>
  );
}
