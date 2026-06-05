import Link from "next/link";
import {
  PRIORITY_PROPERTY_TYPE_SLUGS,
  resolveSeoPropertyType,
} from "@/constants/seoPropertyTypes";

export function RelatedPropertyTypes({
  citySlug,
  neighborhoodSlug,
  excludeSlug,
}: {
  citySlug: string;
  neighborhoodSlug: string;
  excludeSlug?: string;
}) {
  const types = PRIORITY_PROPERTY_TYPE_SLUGS.map((s) => resolveSeoPropertyType(s)).filter(
    (t): t is NonNullable<typeof t> => !!t && t.slug !== excludeSlug
  );

  if (types.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="text-lg font-bold text-navy">Browse by property type</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {types.map((t) => (
          <Link
            key={t.slug}
            href={`/houses/${citySlug}/${neighborhoodSlug}/${t.slug}`}
            className="pressable rounded-xl bg-elevated px-4 py-2 text-sm font-semibold text-navy shadow-sm ring-1 ring-black/[0.04] hover:bg-gold/10"
          >
            {t.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
