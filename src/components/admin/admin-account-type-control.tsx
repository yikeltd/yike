"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePinGate } from "@/components/admin/pin-confirm-modal";
import {
  LISTING_SELLER_ACCOUNT_TYPES,
  listingSellerAccountTypeLabel,
} from "@/lib/profile/seller-account-types";
import type { AccountType, Profile } from "@/types/database";

export function AdminAccountTypeControl({ profile }: { profile: Profile }) {
  const router = useRouter();
  const { requirePin, pinModal } = usePinGate();
  const current = (profile.account_type ?? "individual") as AccountType;
  const [accountType, setAccountType] = useState<AccountType>(current);
  const [companyName, setCompanyName] = useState(profile.company_name ?? "");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const needsCompanyName =
    accountType === "agency" || accountType === "developer";

  async function save() {
    setBusy(true);
    setMessage("");
    setError("");

    const res = await fetch(`/api/admin/profiles/${profile.id}/account-type`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountType,
        reason: reason || undefined,
        companyName: needsCompanyName ? companyName : undefined,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      accountTypeLabel?: string;
    };
    setBusy(false);

    if (!res.ok) {
      setError(data.error ?? "Update failed");
      return;
    }

    setMessage(
      `Profile type updated to ${data.accountTypeLabel ?? listingSellerAccountTypeLabel(accountType)}`
    );
    router.refresh();
  }

  return (
    <section className="space-y-4 rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
      {pinModal}
      <div>
        <h2 className="font-bold text-navy">Profile type</h2>
        <p className="mt-1 text-sm text-muted">
          Upgrade or downgrade seller type — e.g. Individual → Company when CAC is provided
          later.
        </p>
        <p className="mt-2 text-xs text-muted">
          Current: <strong className="text-navy">{listingSellerAccountTypeLabel(current)}</strong>
          {profile.cac_document_path ? " · CAC on file" : ""}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {LISTING_SELLER_ACCOUNT_TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setAccountType(t.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
              accountType === t.value
                ? "bg-gold text-navy"
                : "bg-surface text-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {needsCompanyName ? (
        <Input
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Company / developer name (optional if already set)"
          className="text-sm"
        />
      ) : null}

      <Input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Internal reason (optional)"
        className="text-sm"
      />

      {message ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>
      ) : null}
      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">{error}</p>
      ) : null}

      <Button
        disabled={busy || accountType === current}
        onClick={() => requirePin(() => void save())}
      >
        Save profile type (PIN required)
      </Button>
    </section>
  );
}
