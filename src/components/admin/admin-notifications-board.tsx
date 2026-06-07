"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { usePinGate } from "@/components/admin/pin-confirm-modal";
import {
  NotificationRecipientPicker,
  type SelectedRecipient,
} from "@/components/admin/notification-recipient-picker";
import {
  INDIVIDUAL_TARGET_TYPES,
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_PRIORITIES,
  TARGET_TYPES,
  normalizeTargetType,
  recipientSearchTypeForTarget,
  targetTypeLabel,
  type NotificationTargetType,
} from "@/lib/notifications/admin/constants";

type CampaignRow = {
  id: string;
  title: string;
  body?: string;
  category: string;
  priority: string;
  target_type: string;
  status: string;
  recipient_count: number;
  sent_count?: number;
  scheduled_at: string | null;
  sent_at: string | null;
  created_at: string;
  created_by?: string;
  sent_by?: string | null;
  selected_recipient_ids?: string[] | null;
  action_label?: string | null;
  action_url?: string | null;
};

type TabId = "compose" | "drafts" | "scheduled" | "sent" | "failed";

const ACTION_PRESETS = [
  { label: "— None —", value: "" },
  { label: "View Listing", value: "/agent/listings" },
  { label: "Complete Verification", value: "/agent/verification" },
  { label: "Reactivate Listing", value: "/agent/listings" },
  { label: "Open Profile", value: "/agent" },
  { label: "View Leads", value: "/agent/leads" },
  { label: "Company Profile", value: "/agent/company" },
];

const TABS: { id: TabId; label: string }[] = [
  { id: "compose", label: "Compose" },
  { id: "drafts", label: "Drafts" },
  { id: "scheduled", label: "Scheduled" },
  { id: "sent", label: "Sent" },
  { id: "failed", label: "Failed / Cancelled" },
];

function formatSchedule(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-NG", { timeZone: "Africa/Lagos" });
}

function toLocalDatetimeValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AdminNotificationsBoard({
  initialCampaigns,
}: {
  initialCampaigns: CampaignRow[];
}) {
  const router = useRouter();
  const { requirePin, pinModal } = usePinGate();
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [tab, setTab] = useState<TabId>("compose");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState("normal");
  const [targetType, setTargetType] = useState<NotificationTargetType>("selected_users");
  const [selectedRecipients, setSelectedRecipients] = useState<SelectedRecipient[]>([]);
  const [actionLabel, setActionLabel] = useState("");
  const [actionUrl, setActionUrl] = useState("");
  const [sendTiming, setSendTiming] = useState<"now" | "schedule">("now");
  const [scheduledLocal, setScheduledLocal] = useState("");

  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [audienceSummary, setAudienceSummary] = useState("");
  const [requiresPin, setRequiresPin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const searchType = recipientSearchTypeForTarget(targetType);
  const isIndividual = INDIVIDUAL_TARGET_TYPES.has(targetType);

  const filteredCampaigns = useMemo(() => {
    switch (tab) {
      case "drafts":
        return campaigns.filter((c) => c.status === "draft");
      case "scheduled":
        return campaigns.filter((c) => c.status === "scheduled");
      case "sent":
        return campaigns.filter((c) => c.status === "sent");
      case "failed":
        return campaigns.filter((c) =>
          ["failed", "cancelled"].includes(c.status)
        );
      default:
        return [];
    }
  }, [campaigns, tab]);

  const refreshList = useCallback(async () => {
    const res = await fetch("/api/admin/notifications");
    const data = (await res.json()) as { campaigns?: CampaignRow[] };
    if (data.campaigns) setCampaigns(data.campaigns);
  }, []);

  const refreshPreview = useCallback(async () => {
    const res = await fetch("/api/admin/notifications/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetType,
        selectedRecipientIds: selectedRecipients.map((r) => r.id),
        category,
        priority,
      }),
    });
    const data = (await res.json()) as {
      recipientCount?: number;
      audienceSummary?: string;
      requiresPin?: boolean;
    };
    if (res.ok) {
      setPreviewCount(data.recipientCount ?? 0);
      setAudienceSummary(data.audienceSummary ?? "");
      setRequiresPin(Boolean(data.requiresPin));
    }
  }, [targetType, selectedRecipients, category, priority]);

  function resetCompose() {
    setEditingId(null);
    setTitle("");
    setBody("");
    setCategory("general");
    setPriority("normal");
    setTargetType("selected_users");
    setSelectedRecipients([]);
    setActionLabel("");
    setActionUrl("");
    setSendTiming("now");
    setScheduledLocal("");
    setPreviewCount(null);
    setAudienceSummary("");
    setShowPreview(false);
    setMessage("");
  }

  async function loadCampaignForEdit(c: CampaignRow) {
    const res = await fetch(`/api/admin/notifications/${c.id}`);
    const data = (await res.json()) as {
      campaign?: CampaignRow & { body: string };
    };
    const full = data.campaign;
    if (!full) return;

    const tt = normalizeTargetType(full.target_type) ?? "selected_users";
    const st = recipientSearchTypeForTarget(tt);
    const ids = full.selected_recipient_ids ?? [];

    let recipients: SelectedRecipient[] = [];
    if (st && ids.length > 0) {
      const labelRes = await fetch(
        `/api/admin/notification-recipients?type=${st}&ids=${ids.join(",")}`
      );
      const labelData = (await labelRes.json()) as {
        results?: Array<{
          id: string;
          display_name: string;
          subtitle: string;
          avatar_url: string | null;
        }>;
      };
      recipients = (labelData.results ?? []).map((r) => ({
        id: r.id,
        display_name: r.display_name,
        subtitle: r.subtitle,
        avatar_url: r.avatar_url,
      }));
    }

    setEditingId(full.id);
    setTitle(full.title);
    setBody(full.body ?? "");
    setCategory(full.category);
    setPriority(full.priority);
    setTargetType(tt);
    setActionLabel(full.action_label ?? "");
    setActionUrl(full.action_url ?? "");
    setSendTiming(full.status === "scheduled" ? "schedule" : "now");
    setScheduledLocal(toLocalDatetimeValue(full.scheduled_at));
    setSelectedRecipients(recipients);
    setTab("compose");
    setMessage("Editing campaign.");
  }

  async function submit(sendMode: "draft" | "now" | "schedule") {
    setMessage("");
    if (!title.trim() || !body.trim()) {
      setMessage("Title and message are required.");
      return;
    }
    if (isIndividual && selectedRecipients.length === 0) {
      setMessage("Select at least one recipient.");
      return;
    }
    if (sendMode === "schedule" && !scheduledLocal) {
      setMessage("Choose a schedule date and time.");
      return;
    }

    const payload = {
      title,
      body,
      category,
      priority,
      targetType,
      selectedRecipientIds: selectedRecipients.map((r) => r.id),
      actionLabel: actionLabel || null,
      actionUrl: actionUrl || null,
      sendMode,
      scheduledAt:
        sendMode === "schedule" ? new Date(scheduledLocal).toISOString() : null,
      campaignId: editingId,
    };

    const doSubmit = async () => {
      setBusy(true);
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        recipientCount?: number;
        status?: string;
      };
      setBusy(false);
      if (!res.ok) {
        setMessage(data.error ?? "Request failed");
        return;
      }
      if (sendMode === "now") {
        setMessage(`Sent to ${data.recipientCount ?? 0} recipient(s).`);
      } else if (sendMode === "schedule") {
        setMessage("Notification scheduled.");
      } else {
        setMessage("Draft saved.");
      }
      resetCompose();
      router.refresh();
      await refreshList();
      setTab(sendMode === "now" ? "sent" : sendMode === "schedule" ? "scheduled" : "drafts");
    };

    const needsPin =
      (sendMode === "now" || sendMode === "schedule") && requiresPin;

    if (needsPin) {
      requirePin(() => void doSubmit());
      return;
    }
    await doSubmit();
  }

  async function cancelCampaign(id: string) {
    setBusy(true);
    const res = await fetch(`/api/admin/notifications/${id}/cancel`, {
      method: "POST",
    });
    setBusy(false);
    if (res.ok) {
      await refreshList();
      setMessage("Campaign cancelled.");
    }
  }

  async function processDue() {
    setBusy(true);
    const res = await fetch("/api/admin/notifications/process-due", {
      method: "POST",
    });
    const data = (await res.json()) as { processed?: number };
    setBusy(false);
    setMessage(`Processed ${data.processed ?? 0} due notification(s).`);
    await refreshList();
  }

  return (
    <div className="space-y-6">
      {pinModal}

      <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-elevated p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
              tab === t.id
                ? "bg-navy text-white"
                : "text-muted hover:bg-white hover:text-navy"
            }`}
          >
            {t.label}
            {t.id === "drafts" && (
              <span className="ml-1 opacity-70">
                ({campaigns.filter((c) => c.status === "draft").length})
              </span>
            )}
            {t.id === "scheduled" && (
              <span className="ml-1 opacity-70">
                ({campaigns.filter((c) => c.status === "scheduled").length})
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "compose" && (
        <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-navy">
                {editingId ? "Edit notification" : "Compose notification"}
              </h2>
              <p className="mt-1 text-sm text-muted">
                Search and select recipients. Bulk and urgent sends require admin PIN.
              </p>
            </div>
            {editingId && (
              <Button type="button" variant="ghost" size="sm" onClick={resetCompose}>
                Cancel edit
              </Button>
            )}
          </div>

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
              <label className="text-xs font-bold uppercase text-muted">Target audience</label>
              <Select
                value={targetType}
                onChange={(e) => {
                  setTargetType(e.target.value as NotificationTargetType);
                  setSelectedRecipients([]);
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

            {isIndividual && searchType && (
              <div className="sm:col-span-2">
                <label className="text-xs font-bold uppercase text-muted">Recipients</label>
                <div className="mt-1">
                  <NotificationRecipientPicker
                    searchType={searchType}
                    selected={selectedRecipients}
                    onChange={setSelectedRecipients}
                    disabled={busy}
                  />
                </div>
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

            <div className="sm:col-span-2">
              <label className="text-xs font-bold uppercase text-muted">Send timing</label>
              <div className="mt-2 flex flex-wrap gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="sendTiming"
                    checked={sendTiming === "now"}
                    onChange={() => setSendTiming("now")}
                  />
                  Send now
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="sendTiming"
                    checked={sendTiming === "schedule"}
                    onChange={() => setSendTiming("schedule")}
                  />
                  Schedule for later
                </label>
              </div>
              {sendTiming === "schedule" && (
                <Input
                  type="datetime-local"
                  value={scheduledLocal}
                  onChange={(e) => setScheduledLocal(e.target.value)}
                  className="mt-2 max-w-xs"
                />
              )}
              <p className="mt-1 text-[10px] text-muted">Times use your local timezone (Nigeria: WAT)</p>
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
              Preview
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={() => void submit("draft")}
            >
              Save draft
            </Button>
            {sendTiming === "schedule" ? (
              <Button type="button" disabled={busy} onClick={() => void submit("schedule")}>
                Schedule
              </Button>
            ) : (
              <Button type="button" disabled={busy} onClick={() => void submit("now")}>
                Send now
              </Button>
            )}
          </div>

          {message && <p className="mt-3 text-sm text-navy">{message}</p>}

          {showPreview && (
            <div className="mt-4 rounded-xl border border-gold/30 bg-gold/5 p-4 text-sm">
              <p className="font-semibold text-navy">Send preview</p>
              <p className="mt-2 font-bold">{title || "(no title)"}</p>
              <p className="mt-1 text-muted">{body || "(no message)"}</p>
              <ul className="mt-3 space-y-1 text-xs text-muted">
                <li>Audience: {targetTypeLabel(targetType)}</li>
                <li>
                  {audienceSummary ||
                    (previewCount != null
                      ? `~${previewCount} recipients`
                      : "Calculating…")}
                </li>
                <li>Priority: {priority}</li>
                <li>
                  Send:{" "}
                  {sendTiming === "schedule"
                    ? formatSchedule(
                        scheduledLocal
                          ? new Date(scheduledLocal).toISOString()
                          : null
                      )
                    : "Immediately"}
                </li>
                {requiresPin ? <li className="font-bold text-gold-dark">PIN required</li> : null}
              </ul>
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
      )}

      {tab === "scheduled" && (
        <div className="flex justify-end">
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => void processDue()}>
            Process due notifications
          </Button>
        </div>
      )}

      {tab !== "compose" && (
        <section>
          <ul className="space-y-2">
            {filteredCampaigns.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white px-4 py-3 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-navy">{c.title}</p>
                  <p className="text-xs text-muted">
                    {targetTypeLabel(c.target_type)} · {c.category} · {c.status}
                    {c.recipient_count > 0 ? ` · ${c.recipient_count} sent` : ""}
                    {c.status === "scheduled" && c.scheduled_at
                      ? ` · ${formatSchedule(c.scheduled_at)}`
                      : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {["draft", "scheduled"].includes(c.status) && (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        onClick={() => void loadCampaignForEdit(c)}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        onClick={() => void cancelCampaign(c.id)}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                  <time className="text-[10px] text-muted">
                    {formatSchedule(c.sent_at ?? c.scheduled_at ?? c.created_at)}
                  </time>
                </div>
              </li>
            ))}
            {filteredCampaigns.length === 0 && (
              <p className="text-sm text-muted">No campaigns in this tab.</p>
            )}
          </ul>
        </section>
      )}
    </div>
  );
}
