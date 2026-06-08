import Link from "next/link";
import { adminPath } from "@/lib/admin-paths";
import type { EnrichedAuditLog } from "@/lib/admin/audit-query";
import { RISK_LEVEL_LABELS } from "@/lib/admin/audit-risk";
import { cn } from "@/lib/utils";

const RISK_DOT: Record<string, string> = {
  low: "bg-surface",
  medium: "bg-amber-400",
  high: "bg-orange-500",
  critical: "bg-red-600",
};

export function AdminStaffActivityPanel({
  recentActivity,
  highRiskActivity,
}: {
  recentActivity: EnrichedAuditLog[];
  highRiskActivity: EnrichedAuditLog[];
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-navy">Staff accountability</h2>
          <p className="text-xs text-muted">
            Recent operational actions — searchable in audit logs
          </p>
        </div>
        <Link
          href={adminPath("audit-logs")}
          className="pressable rounded-xl border border-navy/10 px-4 py-2 text-sm font-semibold text-navy"
        >
          Full audit history
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ActivityList title="Recent staff actions" items={recentActivity} />
        <ActivityList
          title="High-risk actions"
          items={highRiskActivity}
          emphasizeRisk
        />
      </div>
    </section>
  );
}

function ActivityList({
  title,
  items,
  emphasizeRisk,
}: {
  title: string;
  items: EnrichedAuditLog[];
  emphasizeRisk?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-navy/10 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-bold text-navy">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-3 text-xs text-muted">No recent activity</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {items.map((item) => (
            <li key={item.id} className="flex gap-3 border-b border-surface pb-3 last:border-0">
              {emphasizeRisk ? (
                <span
                  className={cn(
                    "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                    RISK_DOT[item.risk_level] ?? RISK_DOT.low
                  )}
                  title={RISK_LEVEL_LABELS[item.risk_level]}
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="text-sm text-navy">{item.summary ?? item.action}</p>
                <p className="mt-0.5 text-[10px] text-muted">
                  {item.actor_name ?? item.actor_role} ·{" "}
                  {new Date(item.created_at).toLocaleString("en-NG")}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
