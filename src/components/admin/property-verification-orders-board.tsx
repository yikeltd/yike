"use client";

import { useCallback, useEffect, useState } from "react";
import type { PropertyVerificationOrder } from "@/types/database";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { PROPERTY_VERIFICATION_PACKAGES } from "@/lib/property-verification/packages";

type OrderRow = PropertyVerificationOrder & {
  user?: { id: string; full_name: string | null; email: string | null };
  request?: {
    id: string;
    request_reference: string | null;
    property_title: string | null;
    property_location_text: string | null;
    buyer_full_name: string | null;
    buyer_whatsapp: string | null;
    is_diaspora_request: boolean;
  };
  property?: { id: string; title: string; city: string; area: string };
};

export function PropertyVerificationOrdersBoard() {
  const [tab, setTab] = useState("paid");
  const [tabs, setTabs] = useState<Array<{ id: string; label: string }>>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [assignTo, setAssignTo] = useState<Record<string, string>>({});
  const [reportSummary, setReportSummary] = useState<Record<string, string>>({});
  const [reportUrl, setReportUrl] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/admin/property-verification-orders?tab=${tab}`);
    const data = (await res.json()) as {
      orders?: OrderRow[];
      tabs?: Array<{ id: string; label: string }>;
      error?: string;
    };
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not load orders");
      return;
    }
    setOrders(data.orders ?? []);
    setTabs(data.tabs ?? []);
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  async function runAction(id: string, action: string, extra: Record<string, unknown> = {}) {
    setBusyId(id);
    setError(null);
    const res = await fetch(`/api/admin/property-verification-orders/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    });
    setBusyId(null);
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "Action failed");
      return;
    }
    void load();
  }

  return (
    <div className="space-y-4">
      <nav className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-semibold capitalize",
              tab === t.id ? "bg-navy text-white" : "bg-surface text-muted"
            )}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-muted">No orders in this tab.</p>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => {
            const pkg = PROPERTY_VERIFICATION_PACKAGES[order.package_type];
            return (
              <li key={order.id} className="rounded-xl border border-border bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-navy">
                      {order.request?.property_title ?? order.property?.title ?? "Property"}
                    </p>
                    <p className="text-xs text-muted">
                      {order.verification_reference} · {pkg?.label ?? order.package_type}
                      {order.request?.is_diaspora_request ? " · Diaspora" : ""}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {order.request?.buyer_full_name} · {order.request?.property_location_text}
                    </p>
                  </div>
                  <div className="text-right text-sm font-bold text-navy">
                    {formatPrice(Number(order.amount), "total", "rent")}
                  </div>
                </div>

                {tab === "paid" || tab === "assigned" ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <input
                      placeholder="Assign to (verifier profile UUID)"
                      value={assignTo[order.id] ?? ""}
                      onChange={(e) =>
                        setAssignTo((prev) => ({ ...prev, [order.id]: e.target.value }))
                      }
                      className="min-w-[200px] flex-1 rounded-lg border border-border px-3 py-2 text-xs"
                    />
                    <button
                      type="button"
                      disabled={busyId === order.id || !assignTo[order.id]?.trim()}
                      onClick={() =>
                        void runAction(order.id, "assign", {
                          assignedTo: assignTo[order.id]?.trim(),
                        })
                      }
                      className="rounded-lg bg-navy px-3 py-2 text-xs font-semibold text-white"
                    >
                      Assign
                    </button>
                    {order.status === "assigned" ? (
                      <button
                        type="button"
                        disabled={busyId === order.id}
                        onClick={() => void runAction(order.id, "start_progress")}
                        className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white"
                      >
                        Start progress
                      </button>
                    ) : null}
                  </div>
                ) : null}

                {tab === "in_progress" || tab === "assigned" ? (
                  <div className="mt-3 space-y-2">
                    <textarea
                      placeholder="Report summary for customer"
                      value={reportSummary[order.id] ?? ""}
                      onChange={(e) =>
                        setReportSummary((prev) => ({ ...prev, [order.id]: e.target.value }))
                      }
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                      rows={3}
                    />
                    <input
                      placeholder="Report PDF URL"
                      value={reportUrl[order.id] ?? ""}
                      onChange={(e) =>
                        setReportUrl((prev) => ({ ...prev, [order.id]: e.target.value }))
                      }
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      disabled={busyId === order.id}
                      onClick={() =>
                        void runAction(order.id, "complete", {
                          reportSummary: reportSummary[order.id],
                          reportUrl: reportUrl[order.id],
                        })
                      }
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
                    >
                      Complete & deliver
                    </button>
                  </div>
                ) : null}

                {order.report_summary && tab === "completed" ? (
                  <p className="mt-3 rounded-lg bg-surface p-3 text-sm text-navy">
                    {order.report_summary}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
