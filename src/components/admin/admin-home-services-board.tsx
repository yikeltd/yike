"use client";

import { useCallback, useEffect, useState } from "react";
import { usePinGate } from "@/components/admin/pin-confirm-modal";
import { Button } from "@/components/ui/button";
import {
  getServiceProviderTypeLabel,
  RELOCATION_SUPPORT_SERVICES,
} from "@/constants/serviceProviders";
import { cn } from "@/lib/utils";

type Tab = "providers" | "applications" | "requests" | "complaints";

type ProviderRow = {
  id: string;
  provider_reference: string;
  provider_type: string;
  full_name: string;
  business_name: string | null;
  city: string;
  state: string;
  verification_status: string;
  trust_status: string;
  availability_status: string;
  total_jobs: number;
  complaint_count: number;
  whatsapp: string;
};

type ApplicationRow = {
  id: string;
  full_name: string;
  provider_type: string;
  city: string;
  state: string;
  status: string;
  service_areas: string[];
  why_apply: string | null;
  created_at: string;
};

export function AdminHomeServicesBoard() {
  const { requirePin, pinModal } = usePinGate();
  const [tab, setTab] = useState<Tab>("providers");
  const [enabled, setEnabled] = useState(false);
  const [summary, setSummary] = useState<Record<string, number> | null>(null);
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [requests, setRequests] = useState<Record<string, unknown>[]>([]);
  const [complaints, setComplaints] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/home-services?tab=${tab}`);
    const data = (await res.json()) as Record<string, unknown>;
    setLoading(false);
    if (!res.ok) return;
    setEnabled(Boolean(data.enabled));
    setSummary((data.summary as Record<string, number>) ?? null);
    setProviders((data.providers as ProviderRow[]) ?? []);
    setApplications((data.applications as ApplicationRow[]) ?? []);
    setRequests((data.requests as Record<string, unknown>[]) ?? []);
    setComplaints((data.complaints as Record<string, unknown>[]) ?? []);
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  async function moderateApplication(id: string, action: "approve" | "reject") {
    await requirePin(async () => {
      const res = await fetch(`/api/admin/home-services/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      setMessage(res.ok ? "Application updated" : "Could not update");
      await load();
    });
  }

  async function updateProvider(id: string, status: string) {
    await requirePin(async () => {
      const res = await fetch(`/api/admin/home-services/providers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setMessage(res.ok ? "Provider updated" : "Could not update");
      await load();
    });
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "providers", label: "Providers" },
    { id: "applications", label: "Applications" },
    { id: "requests", label: "Requests" },
    { id: "complaints", label: "Complaints" },
  ];

  return (
    <div className="space-y-4">
      {pinModal}
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        <strong>Internal prep layer.</strong> Public home services are{" "}
        {enabled ? "enabled via ENABLE_HOME_SERVICES" : "disabled"} — no consumer nav or SEO until
        supply quality is ready.
      </div>

      {summary && (
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-surface px-3 py-1 font-semibold">
            Pending apps: {summary.pendingApplications ?? 0}
          </span>
          <span className="rounded-full bg-surface px-3 py-1 font-semibold">
            Open requests: {summary.openRequests ?? 0}
          </span>
          <span className="rounded-full bg-surface px-3 py-1 font-semibold">
            Complaints: {summary.openComplaints ?? 0}
          </span>
          <span className="rounded-full bg-surface px-3 py-1 font-semibold">
            Approved: {summary.approvedProviders ?? 0}
          </span>
        </div>
      )}

      <div className="rounded-xl border bg-white p-4 text-xs text-muted">
        <p className="font-bold text-navy">Relocation support (future)</p>
        <p className="mt-1">{RELOCATION_SUPPORT_SERVICES.join(" · ")}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-bold",
              tab === t.id ? "bg-navy text-white" : "border bg-white text-muted"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && <div className="skeleton h-24 rounded-xl" />}

      {!loading && tab === "providers" && (
        <div className="space-y-2">
          {providers.map((p) => (
            <div key={p.id} className="rounded-xl border bg-white p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-bold text-navy">
                    {p.business_name || p.full_name}{" "}
                    <span className="text-xs font-normal text-muted">({p.provider_reference})</span>
                  </p>
                  <p className="text-xs text-muted">
                    {getServiceProviderTypeLabel(p.provider_type)} · {p.city}, {p.state} ·{" "}
                    {p.verification_status}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Button size="sm" variant="ghost" onClick={() => updateProvider(p.id, "approved")}>
                    Approve
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => updateProvider(p.id, "paused")}>
                    Pause
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => updateProvider(p.id, "fraud_review")}>
                    Fraud review
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {!providers.length && (
            <p className="text-sm text-muted">No service providers yet.</p>
          )}
        </div>
      )}

      {!loading && tab === "applications" && (
        <div className="space-y-2">
          {applications.map((a) => (
            <div key={a.id} className="rounded-xl border bg-white p-3 text-sm">
              <p className="font-bold text-navy">{a.full_name}</p>
              <p className="text-xs text-muted">
                {getServiceProviderTypeLabel(a.provider_type)} · {a.city}, {a.state}
              </p>
              {a.service_areas?.length > 0 && (
                <p className="mt-1 text-xs text-muted">Areas: {a.service_areas.join(", ")}</p>
              )}
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={() => moderateApplication(a.id, "approve")}>
                  Approve
                </Button>
                <Button size="sm" variant="ghost" onClick={() => moderateApplication(a.id, "reject")}>
                  Reject
                </Button>
              </div>
            </div>
          ))}
          {!applications.length && (
            <p className="text-sm text-muted">No pending applications.</p>
          )}
        </div>
      )}

      {!loading && tab === "requests" && (
        <div className="space-y-2">
          {requests.map((r) => (
            <div key={String(r.id)} className="rounded-xl border bg-white p-3 text-sm">
              <p className="font-bold text-navy">{String(r.request_reference)}</p>
              <p className="text-xs text-muted">
                {String(r.service_type)} · {String(r.city)} · {String(r.status)}
              </p>
            </div>
          ))}
          {!requests.length && (
            <p className="text-sm text-muted">No active service requests.</p>
          )}
        </div>
      )}

      {!loading && tab === "complaints" && (
        <div className="space-y-2">
          {complaints.map((c) => (
            <div key={String(c.id)} className="rounded-xl border bg-white p-3 text-sm">
              <p className="font-bold text-navy">{String(c.complaint_type)}</p>
              <p className="text-xs text-muted">{String(c.description)}</p>
            </div>
          ))}
          {!complaints.length && (
            <p className="text-sm text-muted">No open complaints.</p>
          )}
        </div>
      )}

      {message && <p className="text-sm text-muted">{message}</p>}
    </div>
  );
}
