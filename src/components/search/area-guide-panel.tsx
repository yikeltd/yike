import { getAreaGuide } from "@/constants/areaGuides";
import { getAreaProfiles } from "@/constants/areaProfiles";
import { MapPin, Lightbulb } from "lucide-react";

const PROFILE_LABELS: Record<string, string> = {
  luxury: "Premium",
  mid_income: "Mid-income",
  affordable: "Affordable",
  student: "Student zone",
  commercial: "Commercial",
};

export function AreaGuidePanel({
  city,
  area,
  state,
}: {
  city: string;
  area: string;
  state: string;
}) {
  const guide = getAreaGuide(city, area);
  const profiles = getAreaProfiles(city, area);
  if (!guide && profiles.length === 0) return null;

  return (
    <aside className="mb-8 rounded-2xl bg-white p-5 shadow-float ring-1 ring-black/[0.04] lg:p-6">
      <div className="flex items-center gap-2 text-gold-dark">
        <MapPin className="h-4 w-4" />
        <p className="text-xs font-bold uppercase tracking-wider">
          Area guide
        </p>
      </div>
      <h2 className="mt-2 text-lg font-bold text-navy lg:text-xl">
        Living in {area}
      </h2>
      <p className="text-sm text-muted">
        {area}, {city} · {state}
      </p>

      {profiles.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {profiles.map((p) => (
            <span
              key={p}
              className="rounded-full bg-surface px-2.5 py-1 text-xs font-bold text-navy"
            >
              {PROFILE_LABELS[p] ?? p}
            </span>
          ))}
        </div>
      )}

      {guide && (
        <>
          <p className="mt-4 text-sm leading-relaxed text-foreground/90">
            {guide.vibe}
          </p>
          {guide.typicalRent && (
            <p className="mt-3 text-sm">
              <span className="font-bold text-navy">Typical rent: </span>
              <span className="text-muted">{guide.typicalRent}</span>
            </p>
          )}
          {guide.highlights.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {guide.highlights.map((h) => (
                <li
                  key={h}
                  className="rounded-lg bg-gold/10 px-2.5 py-1 text-xs font-semibold text-navy"
                >
                  {h}
                </li>
              ))}
            </ul>
          )}
          {guide.tips.length > 0 && (
            <div className="mt-4 rounded-xl bg-surface/80 p-3">
              <p className="flex items-center gap-1.5 text-xs font-bold text-navy">
                <Lightbulb className="h-3.5 w-3.5 text-gold" />
                Renter tips
              </p>
              <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-muted">
                {guide.tips.map((t) => (
                  <li key={t}>· {t}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </aside>
  );
}
