"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function SearchableBankSelect({
  banks,
  value,
  onChange,
}: {
  banks: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const filtered = query
    ? banks.filter((b) => b.toLowerCase().includes(query.toLowerCase()))
    : banks;

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search bank…"
          className="h-11 w-full rounded-xl border border-border bg-surface pl-9 pr-3 text-sm"
        />
      </div>
      {open && filtered.length > 0 ? (
        <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-xl border border-border bg-elevated py-1 shadow-float">
          {filtered.slice(0, 8).map((b) => (
            <li key={b}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-surface"
                onClick={() => {
                  onChange(b);
                  setQuery(b);
                  setOpen(false);
                }}
              >
                {b}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function BankVerificationCard({
  bankName,
  resolvedName,
  verified,
  defaultOpen = false,
}: {
  bankName?: string | null;
  resolvedName?: string | null;
  verified?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen || !verified);
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
      <div className="rounded-2xl border border-border bg-elevated px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-navy">Bank verification</p>
            <p className="text-xs text-muted">
              {bankName}
              {resolvedName ? ` · ${resolvedName}` : ""}
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
            Verified
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-elevated shadow-float">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="pressable flex w-full items-center justify-between gap-2 px-4 py-3.5 text-left"
        aria-expanded={open}
      >
        <div>
          <p className="text-sm font-semibold text-navy">Bank verification</p>
          <p className="text-xs text-muted">Unlock payouts and stronger trust</p>
        </div>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-muted transition-transform", open && "rotate-180")}
        />
      </button>

      {open ? (
        <div className="space-y-2 border-t border-border px-4 py-3">
          <SearchableBankSelect
            banks={banks}
            value={selectedBank}
            onChange={setSelectedBank}
          />
          <Input
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="10-digit account number"
            inputMode="numeric"
          />
          {resolvedName && !accountNumber ? (
            <p className="text-xs text-muted">On file: {resolvedName}</p>
          ) : null}
          <Button
            onClick={() => void submit()}
            disabled={busy || !selectedBank || accountNumber.length < 10}
            className="w-full"
          >
            {busy ? "Saving…" : "Save bank details"}
          </Button>
          {message ? <p className="text-xs text-emerald-700">{message}</p> : null}
          {error ? <p className="text-xs text-danger">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
