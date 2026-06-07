"use client";

import { useState } from "react";
import { Copy, ExternalLink } from "lucide-react";
import {
  buildAgentHandoffUrl,
  buildSupportHandoffReply,
  listingPublicUrl,
} from "@/lib/leads/whatsapp-urls";

type Props = {
  listingId: string;
  listingTitle: string;
  listingSlug?: string | null;
  publicListingCode?: string | null;
  agentName?: string | null;
  publicAgentCode?: string | null;
  agentWhatsapp?: string | null;
  agentPhone?: string | null;
};

export function ListingLeadRoutingBox({
  listingId,
  listingTitle,
  listingSlug,
  publicListingCode,
  agentName,
  publicAgentCode,
  agentWhatsapp,
  agentPhone,
}: Props) {
  const [copied, setCopied] = useState<"reply" | "link" | null>(null);

  if (!publicListingCode) {
    return (
      <section className="rounded-xl border border-navy/10 bg-white p-4 text-sm text-muted">
        Listing code will appear after migration sync.
      </section>
    );
  }

  const listingUrl = listingPublicUrl(listingSlug, listingId);
  const handoffUrl = buildAgentHandoffUrl({
    agentWhatsapp,
    agentPhone,
    agentName: agentName ?? "Agent",
    listingTitle,
    publicListingCode,
    listingUrl,
  });
  const supportReply = buildSupportHandoffReply({
    agentName: agentName ?? "Agent",
    agentHandoffUrl: handoffUrl,
  });

  async function copy(text: string, kind: "reply" | "link") {
    await navigator.clipboard.writeText(text);
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 2000);
  }

  return (
    <section className="rounded-xl border border-gold/25 bg-gold/5 p-4 space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-wide text-navy">
        Lead routing
      </h3>
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted">List ID</dt>
          <dd className="font-mono font-semibold text-navy">{publicListingCode}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Agent code</dt>
          <dd className="font-mono font-semibold text-navy">
            {publicAgentCode ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Agent</dt>
          <dd className="text-navy">{agentName ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Agent WhatsApp</dt>
          <dd className="font-mono text-xs text-navy">{agentWhatsapp ?? agentPhone ?? "—"}</dd>
        </div>
      </dl>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void copy(supportReply, "reply")}
          className="inline-flex items-center gap-1.5 rounded-lg border border-navy/15 bg-white px-3 py-1.5 text-xs font-semibold text-navy"
        >
          <Copy className="h-3.5 w-3.5" />
          {copied === "reply" ? "Copied" : "Copy support reply"}
        </button>
        <button
          type="button"
          onClick={() => void copy(handoffUrl, "link")}
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
      </div>
    </section>
  );
}
