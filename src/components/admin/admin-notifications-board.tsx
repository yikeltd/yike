"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { usePinGate } from "@/components/admin/pin-confirm-modal";
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_PRIORITIES,
  TARGET_TYPES,
  targetTypeLabel,
  type NotificationTargetType,
} from "@/lib/notifications/admin/constants";

type CampaignRow = {
  id: string;
  title: string;
  category: string;
  priority: string;
  target_type: string;
  status: string;
  recipient_count: number;
  sent_at: string | null;
  created_at: string;
};

const ACTION_PRESETS = [
  { label: "— None —", value: "" },
  { label: "View Listing", value: "/agent/listings" },
  { label: "Complete Verification", value: "/agent/verification" },
  { label: "Reactivate Listing", value: "/agent/listings" },
  { label: "Open Profile", value: "/agent" },
  { label: "View Leads", value: "/agent/leads" },
  { label: "Company Profile", value: "/agent/company" },
];

export function AdminNotificationsBoard({
  initialCampaigns,
}: {
  initialCampaigns: CampaignRow[];
}) {
  const router = useRouter();
  const { requirePin, pinModal } = usePinGate();
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState("normal");
  const [targetType, setTargetType] = useState<NotificationTargetType>("user");
  const [recipientIds, setRecipientIds] = useState("");
  const [actionLabel, setActionLabel] = useState("");
  const [actionUrl, setActionUrl] = useState("");
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [requiresPin, setRequiresPin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const isIndividual = ["user", "agent", "company"].includes(targetType);

  const refreshPreview = useCallback(async () => {
    const res = await fetch("/api/admin/notifications/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetType,
        targetFilters: {},
        recipientIds: recipientIds
          .split(/[\n,]+/)
          .map((s) => s.trim())
          .filter(Boolean),
        category,
        priority,
      }),
    });
    const data = (await res.json()) as {
      recipientCount?: number;
      requiresPin?: boolean;
      error?: string;
    };
    if (res.ok) {
      setPreviewCount(data.recipientCount ?? 0);
      setRequiresPin(Boolean(data.requiresPin));
    }
  }, [targetType, recipientIds, category, priority]);

  async function submit(sendNow: boolean) {
    setMessage("");
    if (!title.trim() || !body.trim()) {
      setMessage("Title and message are required.");
      return;
    }

    const doSend = async () => {
      setBusy(true);
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body,
          category,
          priority,
          targetType,
          recipientIds,
          actionLabel: actionLabel || null,
          actionUrl: actionUrl || null,
          sendNow,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        recipientCount?: number;
        campaignId?: string;
      };
      setBusy(false);
      if (!res.ok) {
        setMessage(data.error ?? "Request failed");
        return;
      }
      setMessage(
        sendNow
          ? `Sent to ${data.recipientCount ?? 0} recipient(s).`
          : "Draft saved."
      );
      setTitle("");
      setBody("");
      setRecipientIds("");
      setPreviewCount(null);
      setShowPreview(false);
      router.refresh();
      if (sendNow) {
        const listRes = await fetch("/api/admin/notifications");
        const listData = (await listRes.json()) as { campaigns?: CampaignRow[] };
        if (listData.campaigns) setCampaigns(listData.campaigns);
      }
    };

    if (sendNow && requiresPin) {
      requirePin(() => void doSend());
      return;
    }
    await doSend();
  }

  return (
    <div className="space-y-8">
      {pinModal}

      <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-navy">Compose notification</h2>
        <p className="mt-1 text-sm text-muted">
          Calm, professional in-app messages. Bulk and urgent sends require admin PIN.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-xs font-bold uppercase text-muted">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Your listing is about to expire"
              maxLength={120}
              className="mt-1"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-bold uppercase text-muted">Message</label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Reactivate it if the property is still available."
              rows={4}
              maxLength={2000}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-muted">Category</label>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1"
            >
              {NOTIFICATION_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-muted">Priority</label>
            <Select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="mt-1"
            >
              {NOTIFICATION_PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-bold uppercase text-muted">Audience</label>
            <Select
              value={targetType}
              onChange={(e) => {
                setTargetType(e.target.value as NotificationTargetType);
                setPreviewCount(null);
              }}
              className="mt-1"
            >
              <optgroup label="Individual">
                {TARGET_TYPES.filter((t) => t.group === "individual").map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Groups">
                {TARGET_TYPES.filter((t) => t.group === "bulk").map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </optgroup>
            </Select>
          </div>
          {isIndividual && (
            <div className="sm:col-span-2">
              <label className="text-xs font-bold uppercase text-muted">
                Recipient user IDs (one per line or comma-separated)
              </label>
              <Textarea
                value={recipientIds}
                onChange={(e) => setRecipientIds(e.target.value)}
                placeholder="Paste profile UUIDs from Users or Agents admin"
                rows={3}
                className="mt-1 font-mono text-xs"
              />
            </div>
          )}
          <div>
            <label className="text-xs font-bold uppercase text-muted">Action label</label>
            <Input
              value={actionLabel}
              onChange={(e) => setActionLabel(e.target.value)}
              placeholder="View Listing"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-muted">Action path</label>
            <Select
              value={actionUrl}
              onChange={(e) => {
                const v = e.target.value;
                setActionUrl(v);
                if (v && !actionLabel) {
                  const preset = ACTION_PRESETS.find((p) => p.value === v);
                  if (preset?.label && preset.label !== "— None —") {
                    setActionLabel(preset.label);
                  }
                }
              }}
              className="mt-1"
            >
              {ACTION_PRESETS.map((p) => (
                <option key={p.value || "none"} value={p.value}>
                  {p.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => {
              setShowPreview(true);
              void refreshPreview();
            }}
          >
            Preview audience
          </Button>
          <Button type="button" variant="ghost" disabled={busy} onClick={() => void submit(false)}>
            Save draft
          </Button>
          <Button type="button" disabled={busy} onClick={() => void submit(true)}>
            Send now
          </Button>
        </div>

        {message && <p className="mt-3 text-sm text-navy">{message}</p>}

        {showPreview && (
          <div className="mt-4 rounded-xl border border-gold/30 bg-gold/5 p-4 text-sm">
            <p className="font-semibold text-navy">Preview</p>
            <p className="mt-2 font-bold">{title || "(no title)"}</p>
            <p className="mt-1 text-muted">{body || "(no message)"}</p>
            <p className="mt-3 text-xs text-muted">
              Audience: {targetTypeLabel(targetType)}
              {previewCount != null ? ` · ~${previewCount} recipients` : " · calculating…"}
              {requiresPin ? " · PIN required to send" : ""}
            </p>
            {actionLabel && actionUrl ? (
              <p className="mt-2">
                <span className="rounded-lg bg-navy px-3 py-1.5 text-xs font-bold text-white">
                  {actionLabel}
                </span>
              </p>
            ) : null}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">
          Sent & draft history
        </h2>
        <ul className="space-y-2">
          {campaigns.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-white px-4 py-3 text-sm"
            >
              <div className="min-w-0">
                <p className="font-semibold text-navy">{c.title}</p>
                <p className="text-xs text-muted">
                  {targetTypeLabel(c.target_type)} · {c.category} · {c.status}
                  {c.recipient_count > 0 ? ` · ${c.recipient_count} sent` : ""}
                </p>
              </div>
              <time className="text-[10px] text-muted">
                {new Date(c.sent_at ?? c.created_at).toLocaleString("en-NG")}
              </time>
            </li>
          ))}
          {campaigns.length === 0 && (
            <p className="text-sm text-muted">No campaigns yet.</p>
          )}
        </ul>
      </section>
    </div>
  );
}
