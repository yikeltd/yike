"use client";

import { useCallback, useEffect, useState } from "react";

export function UsernameSettingsClient() {
  const [username, setUsername] = useState<string | null>(null);
  const [needsUsername, setNeedsUsername] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
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
        setUsername(json.username ?? null);
        setNeedsUsername(Boolean(json.needsUsername));
        setUpdatedAt(json.usernameUpdatedAt ?? null);
        setDraft(json.username ?? "");
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
        body: JSON.stringify({
          username: draft,
          change: Boolean(username),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not save username");
        return;
      }
      setUsername(json.username);
      setNeedsUsername(false);
      setSuccess(`Saved @${json.username}`);
      void load();
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted">Loading username…</p>;
  }

  const cooldownNote =
    username && updatedAt
      ? "Username changes are limited to once every 14 days."
      : null;

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-xs text-navy/65">
        Your @username is used for YC transfers and public profile links — not for sign-in.
      </p>
      <label className="block text-xs font-semibold text-navy">
        Username
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value.toLowerCase())}
          className="mt-1 w-full min-h-[44px] rounded-xl border border-navy/15 px-3 text-sm"
          placeholder="your_name"
          autoComplete="off"
          maxLength={24}
        />
      </label>
      {username ? (
        <p className="text-[11px] text-muted">Current: @{username}</p>
      ) : (
        <p className="text-[11px] text-amber-900">Choose a username to send and receive YC.</p>
      )}
      {cooldownNote ? <p className="text-[11px] text-muted">{cooldownNote}</p> : null}
      <button
        type="submit"
        disabled={saving || draft.length < 3}
        className="pressable min-h-[44px] rounded-xl bg-gold px-4 text-sm font-bold text-navy disabled:opacity-50"
      >
        {saving ? "Saving…" : needsUsername ? "Claim username" : "Update username"}
      </button>
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
      {success ? <p className="text-xs text-emerald-800">{success}</p> : null}
    </form>
  );
}
