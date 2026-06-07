"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import { buildSupportHandoffCopy } from "@/lib/leads/handoff-copy";
import type { HandoffPayload } from "@/lib/leads/handoff";

export function CopyHandoffButton({ data }: { data: HandoffPayload }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(buildSupportHandoffCopy(data));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="inline-flex items-center gap-1.5 rounded-lg border border-navy/15 px-3 py-1.5 text-xs font-semibold text-navy"
    >
      <Copy className="h-3.5 w-3.5" />
      {copied ? "Copied" : "Copy handoff"}
    </button>
  );
}
