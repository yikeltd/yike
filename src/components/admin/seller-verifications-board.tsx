"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { SellerVerification, SellerVerificationStatus } from "@/types/database";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Row = SellerVerification & {
  user?: {
    id: string;
    full_name: string | null;
    company_name: string | null;
    username: string | null;
    account_type: string | null;
  };
  payment?: {
    id: string;
    reference: string;
    status: string;
    amount: number;
    paid_at: string | null;
  } | null;
};

const TABS: { id: SellerVerificationStatus | "all"; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "under_review", label: "Under Review" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
  { id: "all", label: "All" },
];

function statusTone(status: SellerVerificationStatus): string {
  switch (status) {
    case "approved":
      return "bg-emerald-50 text-emerald-800";
    case "under_review":
      return "bg-blue-50 text-blue-800";
    case "pending":
      return "bg-amber-50 text-amber-800";
    case "rejected":
      return "bg-red-50 text-red-700";
    default:
      return "bg-surface text-muted";
  }
}

export function SellerVerificationsBoard() {
  const [tab, setTab] = useState<SellerVerificationStatus | "all">("pending");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const qs = tab === "all" ? "" : `?status=${tab}`;
    const res = await fetch(`/api/admin/seller-verifications${qs}`);
    const data = (await res.json()) as { verifications?: Row[]; error?: string };
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not load requests");
      return;
    }
    setRows(data.verifications ?? []);
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  async function runAction(
    id: string,
    action: "approve" | "reject" | "request_more_info" | "under_review"
  ) {
    setBusyId(id);
    setError(null);
    const res = await fetch(`/api/admin/seller-verifications/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reviewNotes: notes[id] ?? "" }),
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
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-semibold",
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
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted">No verification requests.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => {
            const docs = row.documents as Record<string, string>;
            const sellerName =
              row.user?.company_name?.trim() ||
              row.user?.full_name?.trim() ||
              row.user?.username ||
              row.user_id;
            const paymentStatus = row.payment?.status ?? "n/a";
            const paymentPaid =
              paymentStatus === "successful"
                ? formatPrice(Number(row.payment?.amount ?? 0), "total", "rent")
                : paymentStatus;

            return (
              <li
                key={row.id}
                className="rounded-xl border border-border bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-navy">{sellerName}</p>
                    <p className="text-xs text-muted">
                      {row.user?.account_type ?? "seller"} · submitted{" "}
                      {row.submitted_at
                        ? new Date(row.submitted_at).toLocaleString("en-NG")
                        : "—"}
                    </p>
                    <span
                      className={cn(
                        "mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold",
                        statusTone(row.status)
                      )}
                    >
                      {row.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="text-right text-xs text-muted">
                    <p>Payment: {paymentPaid}</p>
                    {row.payment?.reference ? (
                      <p className="font-mono">{row.payment.reference}</p>
                    ) : null}
                  </div>
                </div>

                <dl className="mt-3 grid gap-1 text-xs text-muted sm:grid-cols-2">
                  {docs.id_document_path ? (
                    <div>
                      <dt className="font-semibold text-navy">ID</dt>
                      <dd className="font-mono break-all">{docs.id_document_path}</dd>
                    </div>
                  ) : null}
                  {docs.cac_certificate_path ? (
                    <div>
                      <dt className="font-semibold text-navy">CAC</dt>
                      <dd className="font-mono break-all">{docs.cac_certificate_path}</dd>
                    </div>
                  ) : null}
                  {docs.rc_bn_number ? (
                    <div>
                      <dt className="font-semibold text-navy">RC/BN</dt>
                      <dd>{docs.rc_bn_number}</dd>
                    </div>
                  ) : null}
                  {docs.contact_phone ? (
                    <div>
                      <dt className="font-semibold text-navy">Contact</dt>
                      <dd>{docs.contact_phone}</dd>
                    </div>
                  ) : null}
                </dl>

                {row.review_notes ? (
                  <p className="mt-2 text-xs text-amber-900">{row.review_notes}</p>
                ) : null}

                <textarea
                  value={notes[row.id] ?? ""}
                  onChange={(e) =>
                    setNotes((prev) => ({ ...prev, [row.id]: e.target.value }))
                  }
                  placeholder="Review notes (reject / request more info)"
                  className="mt-3 w-full rounded-lg border border-border px-3 py-2 text-sm"
                  rows={2}
                />

                <div className="mt-3 flex flex-wrap gap-2">
                  {row.user?.id ? (
                    <Link
                      href={`/lex/auth/agents/${row.user.id}`}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-navy"
                    >
                      View seller
                    </Link>
                  ) : null}
                  {row.status === "pending" ? (
                    <button
                      type="button"
                      disabled={busyId === row.id}
                      onClick={() => void runAction(row.id, "under_review")}
                      className="rounded-lg bg-surface px-3 py-1.5 text-xs font-semibold text-navy"
                    >
                      Mark under review
                    </button>
                  ) : null}
                  {["pending", "under_review"].includes(row.status) ? (
                    <>
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        onClick={() => void runAction(row.id, "approve")}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        onClick={() => void runAction(row.id, "request_more_info")}
                        className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        Request more info
                      </button>
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        onClick={() => void runAction(row.id, "reject")}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        Reject
                      </button>
                    </>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
