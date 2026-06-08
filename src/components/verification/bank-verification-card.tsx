"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";

export function BankVerificationCard({
  bankName,
  resolvedName,
  verified,
}: {
  bankName?: string | null;
  resolvedName?: string | null;
  verified?: boolean;
}) {
  const [banks, setBanks] = useState<string[]>([]);
  const [selectedBank, setSelectedBank] = useState(bankName ?? "");
  const [accountNumber, setAccountNumber] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetch("/api/agent/bank-verification")
      .then((res) => res.json())
      .then((json: { banks?: string[] }) => setBanks(json.banks ?? []));
  }, []);

  async function submit() {
    setBusy(true);
    setError("");
    setMessage("");
    const res = await fetch("/api/agent/bank-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bankName: selectedBank, accountNumber }),
    });
    const json = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      accountName?: string;
      message?: string;
      error?: string;
    };
    setBusy(false);
    if (!res.ok) {
      setError(json.error ?? "Could not save bank details");
      return;
    }
    setMessage(json.message ?? `Saved as ${json.accountName ?? resolvedName ?? "pending review"}`);
  }

  if (verified) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
        <p className="font-semibold">Bank verified</p>
        <p className="mt-1">
          {bankName}
          {resolvedName ? ` · ${resolvedName}` : ""}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-navy/10 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-bold text-navy">Bank verification</h2>
      <p className="mt-1 text-xs text-muted">
        Required for payouts and premium trust. Yike verifies before enabling full access.
      </p>
      <div className="mt-3 space-y-2">
        <Select value={selectedBank} onChange={(e) => setSelectedBank(e.target.value)}>
          <option value="">Select bank</option>
          {banks.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </Select>
        <Input
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
          placeholder="10-digit account number"
          inputMode="numeric"
        />
        {resolvedName && !accountNumber ? (
          <p className="text-xs text-muted">On file: {resolvedName}</p>
        ) : null}
        <Button onClick={() => void submit()} disabled={busy || !selectedBank || accountNumber.length < 10}>
          {busy ? "Saving…" : "Save bank details"}
        </Button>
        {message ? <p className="text-xs text-emerald-700">{message}</p> : null}
        {error ? <p className="text-xs text-danger">{error}</p> : null}
      </div>
    </div>
  );
}
