"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/input";
import type { VerificationControlConfig } from "@/lib/verification/config";
import {
  ENFORCEMENT_ACTION_LABELS,
  type EnforcementAction,
} from "@/lib/verification/enforcement";

type SearchUser = {
  id: string;
  name: string;
  email: string | null;
  verificationStateLabel: string;
  trustLevel: number;
  suspicionScore: number;
};

const TOGGLE_META: {
  key: keyof VerificationControlConfig;
  label: string;
  description: string;
}[] = [
  { key: "email_verification_required", label: "Require email verification", description: "Email must be verified before full access." },
  { key: "whatsapp_verification_required", label: "Require WhatsApp verification", description: "WhatsApp contact required for agents." },
  { key: "bank_verification_required", label: "Require bank verification", description: "Bank details before payouts and premium trust." },
  { key: "listing_review_required", label: "Require listing review", description: "Listings go through moderation before publish." },
  { key: "listing_verification_required", label: "Require verification before listing", description: "Agents must reach listing trust level before posting." },
  { key: "enhanced_review_required", label: "Enhanced verification for suspicious users", description: "Escalated accounts need extra review steps." },
  { key: "company_verification_required", label: "Require company verification", description: "Agency/developer company checks." },
  { key: "cac_verification_required", label: "Require CAC verification", description: "CAC documentation for companies." },
  { key: "auto_escalation_enabled", label: "Enable adaptive trust escalation", description: "System may suggest escalation — humans decide serious actions." },
  { key: "device_abuse_monitoring_enabled", label: "Enable device abuse monitoring", description: "Track suspicious device/IP patterns internally." },
  { key: "multi_account_detection_enabled", label: "Enable multi-account detection", description: "Surface linked accounts in trust review." },
];

const ENFORCEMENT_OPTIONS: EnforcementAction[] = [
  "require_whatsapp",
  "require_bank",
  "require_enhanced_review",
  "restrict_listing",
  "pause_leads",
  "escalate_trust",
  "restore_trust",
  "remove_escalation",
];

function ToggleCard({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`rounded-2xl border p-4 text-left transition ${
        checked
          ? "border-gold/50 bg-gold/10 shadow-sm"
          : "border-navy/10 bg-white hover:border-navy/20"
      } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-navy">{label}</p>
          <p className="mt-1 text-xs text-muted">{description}</p>
        </div>
        <span
          className={`mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full px-0.5 ${
            checked ? "bg-gold" : "bg-navy/15"
          }`}
          aria-hidden
        >
          <span
            className={`h-5 w-5 rounded-full bg-white shadow transition ${
              checked ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </span>
      </div>
    </button>
  );
}

export function AdminVerificationControlPanel() {
  const [config, setConfig] = useState<VerificationControlConfig | null>(null);
  const [canEditToggles, setCanEditToggles] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [enforceAction, setEnforceAction] = useState<EnforcementAction>("require_enhanced_review");
  const [enforceReason, setEnforceReason] = useState("");
  const [enforcing, setEnforcing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/verification-control");
    const json = (await res.json().catch(() => ({}))) as {
      config?: VerificationControlConfig;
      canEditToggles?: boolean;
      error?: string;
    };
    setLoading(false);
    if (!res.ok) {
      setError(json.error ?? "Could not load verification controls");
      return;
    }
    setConfig(json.config ?? null);
    setCanEditToggles(Boolean(json.canEditToggles));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleKey(key: keyof VerificationControlConfig, value: boolean) {
    if (!config || !canEditToggles) return;
    setSavingKey(key);
    setError("");
    const next = { ...config, [key]: value };
    setConfig(next);

    const res = await fetch("/api/admin/verification-control", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    setSavingKey(null);
    if (!res.ok) {
      setError(json.error ?? "Toggle save failed");
      setConfig(config);
      return;
    }
  }

  async function searchUsers() {
    if (searchQ.trim().length < 2) return;
    const res = await fetch(
      `/api/admin/verification-control/users?q=${encodeURIComponent(searchQ.trim())}`
    );
    const json = (await res.json().catch(() => ({}))) as { users?: SearchUser[] };
    setSearchResults(json.users ?? []);
    setSelected(new Set());
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function applyEnforcement() {
    const userIds = [...selected];
    if (userIds.length === 0) return;
    setEnforcing(true);
    setError("");
    const res = await fetch("/api/admin/verification-control/enforce", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userIds,
        action: enforceAction,
        reason: enforceReason.trim() || undefined,
      }),
    });
    const json = (await res.json().catch(() => ({}))) as {
      error?: string;
      succeeded?: string[];
      failed?: string[];
    };
    setEnforcing(false);
    if (!res.ok) {
      setError(json.error ?? "Enforcement failed");
      return;
    }
    setSelected(new Set());
    setEnforceReason("");
    await searchUsers();
  }

  if (loading && !config) {
    return <p className="text-sm text-muted">Loading verification control center…</p>;
  }

  if (!config) {
    return (
      <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-danger">
        {error || "Verification config unavailable"}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-navy">Global verification toggles</h2>
            <p className="mt-1 text-xs text-muted">
              Changes apply immediately in production. Chief admin only.
            </p>
          </div>
          <Link
            href="/lex/auth/trust-review-queue"
            className="text-xs font-semibold text-navy underline"
          >
            Open trust review queue →
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {TOGGLE_META.map((item) => (
            <ToggleCard
              key={item.key}
              label={item.label}
              description={item.description}
              checked={config[item.key]}
              disabled={!canEditToggles || savingKey === item.key}
              onChange={(v) => void toggleKey(item.key, v)}
            />
          ))}
        </div>
        {!canEditToggles ? (
          <p className="mt-3 text-xs text-muted">Read-only — contact chief admin to change global toggles.</p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-navy">Targeted user enforcement</h2>
        <p className="mt-1 text-xs text-muted">
          Search users, select one or more, then apply verification escalation — not instant bans.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Input
            className="min-w-[200px] flex-1"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Search name, email, or user ID"
            onKeyDown={(e) => e.key === "Enter" && void searchUsers()}
          />
          <Button variant="outline" onClick={() => void searchUsers()}>
            Search
          </Button>
        </div>

        {searchResults.length > 0 ? (
          <div className="mt-4 space-y-2">
            {searchResults.map((user) => (
              <label
                key={user.id}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-navy/5 px-3 py-2.5 text-sm"
              >
                <input
                  type="checkbox"
                  checked={selected.has(user.id)}
                  onChange={() => toggleSelect(user.id)}
                  className="accent-gold"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-navy">{user.name}</p>
                  <p className="text-xs text-muted">
                    {user.email ?? user.id} · {user.verificationStateLabel} · L{user.trustLevel}
                    {user.suspicionScore > 0 ? ` · suspicion ${user.suspicionScore}` : ""}
                  </p>
                </div>
                <Link
                  href={`/lex/auth/users/${user.id}`}
                  className="text-xs font-semibold text-navy underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Open
                </Link>
              </label>
            ))}
          </div>
        ) : null}

        <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <Select
            value={enforceAction}
            onChange={(e) => setEnforceAction(e.target.value as EnforcementAction)}
          >
            {ENFORCEMENT_OPTIONS.map((a) => (
              <option key={a} value={a}>
                {ENFORCEMENT_ACTION_LABELS[a]}
              </option>
            ))}
          </Select>
          <Input
            value={enforceReason}
            onChange={(e) => setEnforceReason(e.target.value)}
            placeholder="Internal reason (audit log)"
          />
          <Button
            disabled={enforcing || selected.size === 0}
            onClick={() => void applyEnforcement()}
          >
            {enforcing ? "Applying…" : `Apply to ${selected.size || 0} user(s)`}
          </Button>
        </div>
      </div>

      {error ? (
        <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-danger">{error}</p>
      ) : null}
    </div>
  );
}
