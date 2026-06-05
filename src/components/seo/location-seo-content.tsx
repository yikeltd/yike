import Link from "next/link";
import { getCityPersonality } from "@/constants/cityPersonalities";
import { POPULAR_AREAS } from "@/constants/popularAreas";
import { SafetyNotice } from "@/components/property/safety-notice";
import { ConversionStrip } from "@/components/conversion/conversion-strip";

export function LocationSeoContent({
  city,
  area,
  state,
}: {
  city: string;
  area?: string;
  state: string;
}) {
  const personality = getCityPersonality(city);
  const nearbyAreas = POPULAR_AREAS.filter(
    (a) =>
      a.city.toLowerCase() === city.toLowerCase() &&
      (!area || a.area.toLowerCase() !== area.toLowerCase())
  ).slice(0, 8);

  return (
    <section className="mt-12 space-y-8 border-t border-surface pt-10">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-gold-dark">
          {personality.vibe}
        </p>
        <h2 className="mt-2 text-xl font-bold text-navy lg:text-2xl">
          {area ? `${area}, ${city}` : personality.headline}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          {personality.rentalGuide}
        </p>
      </div>

      {nearbyAreas.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-navy">Nearby areas</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {nearbyAreas.map((a) => (
              <Link
                key={a.href}
                href={a.seoPath}
                className="pressable rounded-full bg-surface px-4 py-2 text-sm font-semibold text-navy hover:bg-gold/10"
              >
                {a.area}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-bold text-navy">Property types</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            { label: "Rent", href: `/search?city=${encodeURIComponent(city)}&type=rent` },
            { label: "Buy", href: `/search?city=${encodeURIComponent(city)}&type=sale` },
            { label: "Shortlet", href: `/search?city=${encodeURIComponent(city)}&type=shortlet` },
            { label: "Land", href: `/search?city=${encodeURIComponent(city)}&hub=land_sale` },
          ].map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="pressable rounded-xl bg-elevated px-4 py-2 text-sm font-semibold text-navy shadow-sm ring-1 ring-black/[0.04]"
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      {personality.faqs.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-navy">FAQs</h3>
          <dl className="mt-4 space-y-4">
            {personality.faqs.map((faq) => (
              <div key={faq.q} className="rounded-xl bg-surface p-4">
                <dt className="text-sm font-bold text-navy">{faq.q}</dt>
                <dd className="mt-1 text-sm text-muted">{faq.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <SafetyNotice compact />

      <ConversionStrip />
    </section>
  );
}
