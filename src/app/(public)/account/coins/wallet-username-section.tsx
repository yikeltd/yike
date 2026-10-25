"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Props = {
  initialUsername: string | null;
  initialNeedsUsername: boolean;
};

export function WalletUsernameSection({ initialUsername, initialNeedsUsername }: Props) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [username, setUsername] = useState(initialUsername);
  const [needsUsername, setNeedsUsername] = useState(initialNeedsUsername);

  useEffect(() => {
    setUsername(initialUsername);
    setNeedsUsername(initialNeedsUsername);
  }, [initialUsername, initialNeedsUsername]);

  async function submitClaim(e: React.FormEvent) {
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
        if (json.code === "already_set" || String(json.error ?? "").includes("already have a username")) {
          const status = await fetch("/api/account/username", { cache: "no-store" });
          const statusJson = await status.json();
          if (status.ok && statusJson.username) {
            setUsername(statusJson.username);
            setNeedsUsername(false);
            router.refresh();
            return;
          }
        }
        setError(json.error ?? "Could not save username");
        return;
      }
      setUsername(json.username);
      setNeedsUsername(false);
      setSuccess(`You're @${json.username}`);
      setDraft("");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (!needsUsername && username) {
    return (
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-navy/10 bg-white px-4 py-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted">Your username</p>
          <p className="truncate text-base font-black text-navy">@{username}</p>
        </div>
        <Link
          href="/agent/edit-profile"
          className="pressable shrink-0 rounded-xl border border-navy/15 px-4 py-2.5 text-sm font-bold text-navy"
        >
          Change username
        </Link>
      </div>
    );
  }

  if (!needsUsername) {
    return null;
  }

  return (
    <div className="mt-4 rounded-2xl border border-gold/35 bg-gold/10 p-4">
      <p className="text-sm font-bold text-navy">Choose a username</p>
      <p className="mt-1 text-xs text-navy/65">
        Required to send YC. Others find you with @username — not your email or phone.
      </p>
      <form onSubmit={submitClaim} className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label htmlFor="wallet-username" className="block text-xs font-semibold text-navy">
            Username
          </label>
          <input
            id="wallet-username"
            value={draft}
            onChange={(e) => setDraft(e.target.value.toLowerCase())}
            className="mt-1 w-full min-h-[44px] rounded-xl border border-navy/15 px-3 text-sm"
            placeholder="e.g. ada_enugu"
            autoComplete="off"
            maxLength={24}
          />
        </div>
        <button
          type="submit"
          disabled={saving || draft.length < 3}
          className="pressable yike-btn-accent min-h-[44px] shrink-0 rounded-xl bg-gold px-5 text-sm font-bold text-navy disabled:opacity-50 sm:min-w-[9rem]"
        >
          {saving ? "Saving…" : "Claim username"}
        </button>
      </form>
      {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}
      {success ? <p className="mt-2 text-xs text-emerald-800">{success}</p> : null}
    </div>
  );
}
