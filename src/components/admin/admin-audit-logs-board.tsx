"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { adminPath } from "@/lib/admin-paths";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { StatusBadge } from "@/components/admin/dashboard/admin-ui";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { EnrichedAuditLog } from "@/lib/admin/audit-query";
import type { AuditRiskLevel } from "@/lib/admin/audit-risk";
import { RISK_LEVEL_LABELS } from "@/lib/admin/audit-risk";
import { cn } from "@/lib/utils";

const RISK_STYLES: Record<AuditRiskLevel, string> = {
  low: "border-surface bg-white",
  medium: "border-amber-200 bg-amber-50/40",
  high: "border-orange-300 bg-orange-50/50",
  critical: "border-red-300 bg-red-50/60",
};

const RISK_BADGE: Record<AuditRiskLevel, string> = {
  low: "bg-surface text-muted",
  medium: "bg-amber-100 text-amber-900",
  high: "bg-orange-100 text-orange-900",
  critical: "bg-red-100 text-red-800",
};

type Filters = {
  q: string;
  action: string;
  actorId: string;
  targetUserId: string;
  riskLevel: string;
  from: string;
  to: string;
};

export function AdminAuditLogsBoard({
  initialLogs,
  initialTotal,
  page,
}: {
  initialLogs: EnrichedAuditLog[];
  initialTotal: number;
  page: number;
}) {
  const [logs, setLogs] = useState(initialLogs);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    q: "",
    action: "",
    actorId: "",
    targetUserId: "",
    riskLevel: "",
    from: "",
    to: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: "50" });
    if (filters.q) params.set("q", filters.q);
    if (filters.action) params.set("action", filters.action);
    if (filters.actorId) params.set("actorId", filters.actorId);
    if (filters.targetUserId) params.set("targetUserId", filters.targetUserId);
    if (filters.riskLevel) params.set("riskLevel", filters.riskLevel);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);

    const res = await fetch(`/api/admin/audit-logs?${params}`);
    const data = (await res.json()) as { logs?: EnrichedAuditLog[]; total?: number };
    setLogs(data.logs ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [filters, page]);

  useEffect(() => {
    setLogs(initialLogs);
    setTotal(initialTotal);
  }, [initialLogs, initialTotal]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-navy/10 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            placeholder="Search summary, action, staff…"
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
          />
          <Input
            placeholder="Action type (e.g. agent.suspend)"
            value={filters.action}
            onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))}
          />
          <select
            value={filters.riskLevel}
            onChange={(e) => setFilters((f) => ({ ...f, riskLevel: e.target.value }))}
            className="rounded-xl border border-navy/10 px-3 py-2 text-sm"
          >
            <option value="">All risk levels</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Moderation</option>
            <option value="low">Routine</option>
          </select>
          <Input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" onClick={() => void load()} disabled={loading}>
            {loading ? "Searching…" : "Apply filters"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setFilters({
                q: "",
                action: "",
                actorId: "",
                targetUserId: "",
                riskLevel: "",
                from: "",
                to: "",
              });
            }}
          >
            Clear
          </Button>
        </div>
      </div>

      {logs.length === 0 ? (
        <p className="rounded-2xl border border-navy/10 bg-white p-8 text-sm text-muted">
          No audit entries match your filters.
        </p>
      ) : (
        <>
          <div className="space-y-3">
            {logs.map((log) => (
              <article
                key={log.id}
                className={cn(
                  "rounded-2xl border p-4 shadow-sm transition-colors",
                  RISK_STYLES[log.risk_level ?? "low"]
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-navy">
                      {log.summary ?? log.action}
                    </p>
                    <p className="mt-1 font-mono text-[10px] text-muted">{log.action}</p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                      RISK_BADGE[log.risk_level ?? "low"]
                    )}
                  >
                    {RISK_LEVEL_LABELS[log.risk_level ?? "low"]}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted">
                  <time>{new Date(log.created_at).toLocaleString("en-NG")}</time>
                  <StatusBadge status={log.actor_role} />
                  {log.actor_name ? <span>{log.actor_name}</span> : null}
                  {log.target_user_id ? (
                    <Link
                      href={adminPath(`users/${log.target_user_id}`)}
                      className="font-semibold text-gold-dark"
                    >
                      View account
                    </Link>
                  ) : null}
                  {log.reason ? (
                    <span className="italic">Reason: {log.reason}</span>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
          <AdminPagination basePath="/lex/auth/audit-logs" total={total} page={page} />
        </>
      )}
    </div>
  );
}
