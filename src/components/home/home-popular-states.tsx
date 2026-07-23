import Link from "next/link";
import { POPULAR_STATE_KEYS } from "@/lib/search-dropdown-options";
import { getStateDisplayLabel } from "@/lib/constants";

const STATE_HREF: Record<string, string> = {
  Lagos: "/houses/lagos",
  FCT: "/houses/abuja",
  Rivers: "/houses/port-harcourt",
  Ogun: "/search?state=Ogun",
  Oyo: "/search?state=Oyo",
};

/** Popular states for marketplace discovery (property-led hubs for now). */
export function HomePopularStates() {
  return (
    <section className="mx-auto max-w-7xl px-3 py-8 lg:px-6 xl:px-8">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-dark">
            Explore
          </p>
          <h2 className="text-lg font-bold text-navy lg:text-xl">
            Popular States
          </h2>
        </div>
        <Link
          href="/explore"
          className="text-sm font-bold text-gold-dark hover:underline"
        >
          View More →
        </Link>
      </div>
      <div className="flex flex-wrap gap-2">
        {POPULAR_STATE_KEYS.map((key) => (
          <Link
            key={key}
            href={STATE_HREF[key] ?? `/search?state=${encodeURIComponent(key)}`}
            className="pressable rounded-full border border-navy/12 bg-white px-4 py-2.5 text-sm font-semibold text-navy shadow-sm hover:border-gold/40"
          >
            {getStateDisplayLabel(key)}
          </Link>
        ))}
      </div>
    </section>
  );
}
