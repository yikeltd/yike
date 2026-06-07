import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { toSlug } from "@/lib/location-slugs";

type AreaRow = { city: string; area: string; count: number };

export default async function AdminSeoPagesPage() {
  const admin = createAdminClient();
  if (!admin) {
    return <p className="text-muted">Database unavailable.</p>;
  }

  const { data } = await admin
    .from("properties")
    .select("city, area")
    .eq("status", "approved")
    .gt("expires_at", new Date().toISOString());

  const counts = new Map<string, AreaRow>();
  for (const row of data ?? []) {
    const city = String(row.city ?? "").trim();
    const area = String(row.area ?? "").trim();
    if (!city || !area) continue;
    const key = `${city.toLowerCase()}|${area.toLowerCase()}`;
    const existing = counts.get(key);
    if (existing) existing.count++;
    else counts.set(key, { city, area, count: 1 });
  }

  const areas = [...counts.values()]
    .filter((a) => a.count >= 1)
    .sort((a, b) => b.count - a.count)
    .slice(0, 120);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">SEO Pages</h1>
        <p className="text-sm text-muted">
          Area landing pages with live listings · {areas.length} active areas
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-navy/5 bg-surface/80">
                <th className="px-4 py-3 text-xs font-bold uppercase text-muted">
                  URL
                </th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-muted">
                  Listings
                </th>
              </tr>
            </thead>
            <tbody>
              {areas.map((row) => {
                const href = `/houses/${toSlug(row.city)}/${toSlug(row.area)}`;
                return (
                  <tr key={href} className="border-b border-navy/5">
                    <td className="px-4 py-3">
                      <Link
                        href={href}
                        target="_blank"
                        className="font-mono text-xs text-navy hover:underline"
                      >
                        {href}
                      </Link>
                      <p className="text-xs text-muted">
                        {row.area}, {row.city}
                      </p>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{row.count}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
