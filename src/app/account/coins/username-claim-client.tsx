"use client";

import { useCallback, useEffect, useState } from "react";

export function UsernameClaimClient({ onClaimed }: { onClaimed?: (username: string) => void }) {
  const [needsUsername, setNeedsUsername] = useState(false);
  const [username, setUsername] = useState("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/account/username", { cache: "no-store" });
      const json = await res.json();
      if (res.ok) {
        setNeedsUsername(Boolean(json.needsUsername));
        setUsername(json.username ?? "");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/account/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: draft }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not save username");
        return;
      }
      setUsername(json.username);
      setNeedsUsername(false);
      setSuccess(`You're @${json.username}`);
      onClaimed?.(json.username);
    } finally {
      setSaving(false);
    }
  }

  if (loading || !needsUsername) return null;

  return (
    <div className="mt-4 rounded-2xl border border-gold/35 bg-gold/10 p-4">
      <p className="text-sm font-bold text-navy">Choose your username</p>
      <p className="mt-1 text-xs text-navy/65">
        Required to send YC. Others can find you with @username — not your email or phone.
      </p>
      <form onSubmit={submit} className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="flex-1 text-xs font-semibold text-navy">
          Username
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value.toLowerCase())}
            className="mt-1 w-full min-h-[44px] rounded-xl border border-navy/15 px-3 text-sm"
            placeholder="e.g. ada_enugu"
            autoComplete="off"
            maxLength={24}
          />
        </label>
        <button
          type="submit"
          disabled={saving || draft.length < 3}
          className="pressable yike-btn-accent min-h-[44px] rounded-xl bg-gold px-4 text-sm font-bold text-navy disabled:opacity-50"
        >
          {saving ? "Saving…" : "Claim username"}
        </button>
      </form>
      {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}
      {success ? <p className="mt-2 text-xs text-emerald-800">{success}</p> : null}
      {username ? <p className="mt-1 text-xs text-navy/55">Current: @{username}</p> : null}
    </div>
  );
}
