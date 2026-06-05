import Link from "next/link";
import { POPULAR_AREAS } from "@/constants/popularAreas";
import { PageSection } from "./page-section";

export function NeighborhoodChips({
  title = "Trending neighborhoods",
  subtitle = "High-intent areas renters search right now",
  limit = 12,
}: {
  title?: string;
  subtitle?: string;
  limit?: number;
}) {
  return (
    <PageSection title={title} subtitle={subtitle} href="/search">
      <div className="hide-scrollbar -mx-3 flex gap-2 overflow-x-auto px-3 pb-1 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
        {POPULAR_AREAS.slice(0, limit).map((t) => (
          <Link
            key={t.href}
            href={t.seoPath}
            className="pressable shrink-0 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-navy shadow-float transition-colors hover:bg-gold/10 lg:rounded-xl lg:px-5 lg:py-3"
          >
            {t.label}
          </Link>
        ))}
      </div>
    </PageSection>
  );
}
