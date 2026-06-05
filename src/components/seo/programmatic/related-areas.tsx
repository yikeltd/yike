import Link from "next/link";
import { resolveAreaSlug, toSlug } from "@/lib/location-slugs";
import { POPULAR_AREAS } from "@/constants/popularAreas";

export function RelatedAreas({
  city,
  citySlug,
  excludeArea,
  limit = 8,
}: {
  city: string;
  citySlug: string;
  excludeArea?: string;
  limit?: number;
}) {
  const areas = POPULAR_AREAS.filter(
    (a) =>
      a.city.toLowerCase() === city.toLowerCase() &&
      (!excludeArea || a.area.toLowerCase() !== excludeArea.toLowerCase()) &&
      resolveAreaSlug(citySlug, toSlug(a.area))
  ).slice(0, limit);

  if (areas.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="text-lg font-bold text-navy">Related neighborhoods in {city}</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {areas.map((a) => (
          <Link
            key={a.href}
            href={`/houses/${citySlug}/${toSlug(a.area)}`}
            className="pressable rounded-full bg-surface px-4 py-2 text-sm font-semibold text-navy hover:bg-gold/10"
          >
            {a.area}
          </Link>
        ))}
      </div>
    </section>
  );
}
