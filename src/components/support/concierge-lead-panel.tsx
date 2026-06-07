"use client";

import { useState } from "react";
import { Copy, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { buildSupportHandoffCopy } from "@/lib/leads/handoff-copy";
import type { HandoffPayload } from "@/lib/leads/handoff";
import { buildAgentHandoffUrl, listingPublicUrl } from "@/lib/leads/whatsapp-urls";

export function ConciergeLeadPanel({ data }: { data: HandoffPayload }) {
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const listingUrl =
    data.listingUrl ?? listingPublicUrl(data.listingSlug, data.listingId);
  const publicListingCode = data.publicListingCode ?? data.yikeReference;
  const handoffUrl =
    data.agentHandoffUrl ??
    buildAgentHandoffUrl({
      agentWhatsapp: data.agentWhatsapp,
      agentPhone: data.agentPhone,
      agentName: data.agentName,
      listingTitle: data.title,
      publicListingCode,
      listingUrl,
    });
  const supportReply = buildSupportHandoffCopy(data);

  async function copy(text: string, key: string, action?: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    if (action && data.leadId) {
      setLoading(action);
      await fetch(`/api/support/leads/${data.leadId}/concierge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      setLoading(null);
    }
    window.setTimeout(() => setCopied(null), 2000);
  }

  async function updateStatus(action: string) {
    setLoading(action);
    await fetch(`/api/support/leads/${data.leadId}/concierge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setLoading(null);
    window.location.reload();
  }

  return (
    <section className="rounded-xl border border-gold/25 bg-gold/5 p-5 space-y-4">
      <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
        Concierge handoff
      </h2>
      <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <dt className="text-xs text-muted">Lead code</dt>
          <dd className="font-mono font-semibold text-navy">
            {data.leadCode ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">List ID</dt>
          <dd className="font-mono font-semibold text-navy">{publicListingCode}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Agent ID</dt>
          <dd className="font-mono font-semibold text-navy">
            {data.publicAgentCode ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Status</dt>
          <dd className="capitalize text-navy">
            {(data.conciergeStatus ?? "intent_created").replace(/_/g, " ")}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Agent WhatsApp</dt>
          <dd className="font-mono text-xs text-navy">
            {data.agentWhatsapp ?? data.agentPhone ?? "—"}
          </dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!!loading}
          onClick={() => void copy(supportReply, "reply", "copy_support_reply")}
          className="inline-flex items-center gap-1.5 rounded-lg border border-navy/15 bg-white px-3 py-1.5 text-xs font-semibold text-navy"
        >
          <Copy className="h-3.5 w-3.5" />
          {copied === "reply" ? "Copied" : "Copy support reply"}
        </button>
        <button
          type="button"
          disabled={!!loading}
          onClick={() => void copy(handoffUrl, "link", "copy_handoff_link")}
          className="inline-flex items-center gap-1.5 rounded-lg border border-navy/15 bg-white px-3 py-1.5 text-xs font-semibold text-navy"
        >
          <Copy className="h-3.5 w-3.5" />
          {copied === "link" ? "Copied" : "Copy agent handoff link"}
        </button>
        <a
          href={handoffUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-3 py-1.5 text-xs font-semibold text-gold"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open agent WhatsApp
        </a>
        <button
          type="button"
          disabled={loading === "mark_handoff_shared"}
          onClick={() => void updateStatus("mark_handoff_shared")}
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800"
        >
          Mark handoff shared
        </button>
        <button
          type="button"
          disabled={loading === "user_messaged_yike"}
          onClick={() => void updateStatus("user_messaged_yike")}
          className="rounded-lg border border-navy/15 px-3 py-1.5 text-xs font-semibold text-navy"
        >
          User messaged Yike
        </button>
        <button
          type="button"
          disabled={loading === "agent_contacted"}
          onClick={() => void updateStatus("agent_contacted")}
          className="rounded-lg border border-navy/15 px-3 py-1.5 text-xs font-semibold text-navy"
        >
          Agent contacted
        </button>
        <button
          type="button"
          disabled={loading === "qualified"}
          onClick={() => void updateStatus("qualified")}
          className="rounded-lg border border-gold/30 bg-gold/10 px-3 py-1.5 text-xs font-semibold text-navy"
        >
          Qualified
        </button>
        <button
          type="button"
          disabled={loading === "closed_won"}
          onClick={() => void updateStatus("closed_won")}
          className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-800"
        >
          Closed won
        </button>
        <button
          type="button"
          disabled={loading === "closed_lost"}
          onClick={() => void updateStatus("closed_lost")}
          className="rounded-lg border border-navy/15 px-3 py-1.5 text-xs font-semibold text-navy"
        >
          Closed lost
        </button>
        <button
          type="button"
          disabled={loading === "mark_spam"}
          onClick={() => void updateStatus("mark_spam")}
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700"
        >
          Spam
        </button>
        <button
          type="button"
          disabled={loading === "cancel"}
          onClick={() => void updateStatus("cancel")}
          className="rounded-lg border border-navy/15 px-3 py-1.5 text-xs font-semibold text-navy"
        >
          Cancel lead
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <label className="flex-1 min-w-[200px] text-xs">
          <span className="font-semibold text-navy">Internal note</span>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note for support…"
            className="mt-1"
          />
        </label>
        <button
          type="button"
          disabled={!note.trim() || loading === "add_note"}
          onClick={async () => {
            setLoading("add_note");
            await fetch(`/api/support/leads/${data.leadId}/concierge`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "add_note", note: note.trim() }),
            });
            setNote("");
            setLoading(null);
            window.location.reload();
          }}
          className="rounded-lg bg-navy px-3 py-2 text-xs font-semibold text-gold"
        >
          Save note
        </button>
      </div>

      <details className="text-xs text-muted">
        <summary className="cursor-pointer font-semibold text-navy">
          Preview support reply
        </summary>
        <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-white p-3 text-[11px] leading-relaxed text-navy">
          {supportReply}
        </pre>
      </details>
    </section>
  );
}
