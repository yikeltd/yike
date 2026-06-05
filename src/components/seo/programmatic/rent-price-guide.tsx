import Link from "next/link";
import { getAreaGuide } from "@/constants/areaGuides";
import { getCityPersonality } from "@/constants/cityPersonalities";

export function RentPriceGuide({
  city,
  neighborhood,
}: {
  city: string;
  neighborhood?: string;
}) {
  const guide = neighborhood ? getAreaGuide(city, neighborhood) : null;
  const personality = getCityPersonality(city);
  const rent = guide?.typicalRent;

  return (
    <section className="mt-10 rounded-2xl bg-gold/10 p-5 lg:p-6">
      <h2 className="text-lg font-bold text-navy">Rent guidance</h2>
      {rent ? (
        <p className="mt-2 text-sm text-muted">
          Typical range in {neighborhood}: <strong className="text-navy">{rent}</strong>.
          Prices change with road access, finishing and security — use live listings below as your
          reference.
        </p>
      ) : (
        <p className="mt-2 text-sm text-muted">{personality.rentalGuide}</p>
      )}
      {guide?.highlights && guide.highlights.length > 0 && (
        <ul className="mt-3 list-inside list-disc text-sm text-muted">
          {guide.highlights.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      )}
      <Link
        href="/request-property"
        className="pressable mt-4 inline-flex text-sm font-bold text-gold-dark hover:underline"
      >
        Can&apos;t find your budget? Request a property →
      </Link>
    </section>
  );
}
