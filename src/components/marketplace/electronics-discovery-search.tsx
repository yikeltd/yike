import Link from "next/link";
import { ELECTRONICS_CATEGORIES } from "@/lib/marketplace/electronics-specs";

/** Initial electronics browse — full search form before the user submits. */
export function ElectronicsDiscoverySearch({
  defaultQuery = "",
  defaultCategory = "",
}: {
  defaultQuery?: string;
  defaultCategory?: string;
}) {
  return (
    <div data-testid="electronics-discovery-search">
      <form method="get" className="mb-3 flex flex-col gap-2 sm:flex-row">
        <input
          name="q"
          defaultValue={defaultQuery}
          placeholder="Search brand, model, city…"
          className="flex-1 rounded-2xl border border-navy/15 px-4 py-3 text-sm"
        />
        <select
          name="category"
          defaultValue={defaultCategory}
          className="rounded-2xl border border-navy/15 px-3 py-3 text-sm"
        >
          <option value="">All categories</option>
          {ELECTRONICS_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-2xl bg-navy px-5 py-3 text-sm font-bold text-white"
        >
          Search
        </button>
      </form>

      <div className="mb-2 flex flex-wrap gap-2">
        {ELECTRONICS_CATEGORIES.slice(0, 6).map((c) => (
          <Link
            key={c.id}
            href={`/electronics?category=${c.id}`}
            className="rounded-full border border-navy/10 bg-white px-3 py-1.5 text-xs font-semibold text-navy hover:border-gold/40"
          >
            {c.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
