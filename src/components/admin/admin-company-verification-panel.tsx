"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePinGate } from "@/components/admin/pin-confirm-modal";
import { Button } from "@/components/ui/button";
import { maskBankAccount } from "@/lib/listing-lifecycle";

type RequestRow = {
  id: string;
  company_id: string;
  cac_number: string | null;
  cac_document_url: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_name: string | null;
  applicant_name: string | null;
  applicant_role: string | null;
  applicant_phone: string | null;
  applicant_email: string | null;
  status: string;
  created_at: string;
  company?: {
    company_name: string | null;
    full_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
};

export function AdminCompanyVerificationPanel({
  requests,
}: {
  requests: RequestRow[];
}) {
  const router = useRouter();
  const { requirePin, pinModal } = usePinGate();
  const [busy, setBusy] = useState<string | null>(null);

  async function act(
    row: RequestRow,
    action: "approve" | "reject" | "needs_more_info"
  ) {
    setBusy(row.id);
    const res = await fetch("/api/admin/company-verification", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        request_id: row.id,
        company_id: row.company_id,
        action,
      }),
    });
    setBusy(null);
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      alert(data.error ?? "Failed");
      return;
    }
    router.refresh();
  }

  if (!requests.length) {
    return (
      <p className="rounded-2xl border border-navy/10 bg-white p-8 text-sm text-muted">
        No pending company verification requests.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {pinModal}
      {requests.map((row) => (
        <article
          key={row.id}
          className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm"
        >
          <h2 className="font-bold text-navy">
            {row.company?.company_name ?? row.company?.full_name ?? "Company"}
          </h2>
          <p className="text-xs text-muted">
            Submitted {new Date(row.created_at).toLocaleString("en-NG")}
          </p>
          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">CAC</dt>
              <dd>{row.cac_number ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Applicant</dt>
              <dd>
                {row.applicant_name ?? "—"}
                {row.applicant_role ? ` · ${row.applicant_role}` : ""}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Bank</dt>
              <dd>
                {row.bank_name ?? "—"} · {maskBankAccount(row.bank_account_number)}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Account name</dt>
              <dd>{row.bank_account_name ?? "—"}</dd>
            </div>
          </dl>
          {row.cac_document_url ? (
            <a
              href={row.cac_document_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-xs font-bold text-gold-dark"
            >
              View CAC document →
            </a>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={busy === row.id}
              onClick={() =>
                requirePin(() => void act(row, "approve"))
              }
            >
              Approve (PIN)
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy === row.id}
              onClick={() =>
                requirePin(() => void act(row, "reject"))
              }
            >
              Reject (PIN)
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy === row.id}
              onClick={() => void act(row, "needs_more_info")}
            >
              Request more info
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}
