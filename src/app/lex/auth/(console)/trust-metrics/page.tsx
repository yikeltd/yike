import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { TrustQualityBatchButton } from "@/components/admin/trust-quality-controls";
import { parseAdminPage, ADMIN_PAGE_SIZE } from "@/lib/admin/pagination";
import { agentPublicPath } from "@/lib/agent-slugs";
import type { Profile } from "@/types/database";

type TrustRow = {
  profile_id: string;
  trust_score: number;
  performance_score: number;
  response_rate: number;
  avg_response_time_minutes: number | null;
  active_listing_count: number;
  stale_listing_ratio: number;
  moderation_flags: number;
  updated_at: string;
  profile: Pick<
    Profile,
    "id" | "full_name" | "public_slug" | "is_responsive" | "verification_level"
  > | null;
};

export default async function AdminTrustMetricsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const { page, from } = parseAdminPage(params);
  const admin = createAdminClient();
  if (!admin) {
    return <p className="text-muted">Database unavailable.</p>;
  }

  const { data, count } = await admin
    .from("agent_trust_metrics")
    .select(
      "profile_id, trust_score, performance_score, response_rate, avg_response_time_minutes, active_listing_count, stale_listing_ratio, moderation_flags, updated_at, profile:profiles(id, full_name, public_slug, is_responsive, verification_level)",
      { count: "exact" }
    )
    .order("trust_score", { ascending: false })
    .range(from, from + ADMIN_PAGE_SIZE - 1);

  const total = count ?? 0;
  const rows = (data ?? []).map((row) => {
    const profileRaw = row.profile as
      | TrustRow["profile"]
      | TrustRow["profile"][]
      | null;
    const profile = Array.isArray(profileRaw) ? profileRaw[0] ?? null : profileRaw;
    return { ...row, profile } as TrustRow;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Trust Metrics</h1>
          <p className="text-sm text-muted">
            Internal agent quality scores — not shown publicly · {total} agents
          </p>
        </div>
        <TrustQualityBatchButton />
      </div>

      <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-navy/5 bg-surface/80">
                {[
                  "Agent",
                  "Trust",
                  "Performance",
                  "Response rate",
                  "Avg response",
                  "Listings",
                  "Stale ratio",
                  "Flags",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted">
                    No trust metrics yet. Run recalculate to populate.
                  </td>
                </tr>
              )}
              {rows.map((row) => {
                const profile = row.profile;
                const name = profile?.full_name ?? row.profile_id.slice(0, 8);
                const href = profile
                  ? agentPublicPath(profile as Profile)
                  : `/lex/auth/agents/${row.profile_id}`;
                return (
                  <tr key={row.profile_id} className="border-b border-navy/5">
                    <td className="px-4 py-3">
                      <Link href={href} className="font-semibold text-navy hover:underline">
                        {name}
                      </Link>
                      {profile?.is_responsive && (
                        <span className="ml-2 text-[10px] font-bold text-emerald-600">
                          Responsive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{row.trust_score}</td>
                    <td className="px-4 py-3 tabular-nums">{row.performance_score}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {Math.round(row.response_rate * 100)}%
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {row.avg_response_time_minutes != null
                        ? `${Math.round(row.avg_response_time_minutes)}m`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{row.active_listing_count}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {Math.round(row.stale_listing_ratio * 100)}%
                    </td>
                    <td className="px-4 py-3 tabular-nums">{row.moderation_flags}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AdminPagination
        basePath="/lex/auth/trust-metrics"
        total={total}
        page={page}
      />
    </div>
  );
}
