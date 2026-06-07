"use client";

import { useEffect, useState } from "react";
import { Copy, Search } from "lucide-react";
import type { SupportQuickReply } from "@/lib/leads/operations-types";

export function QuickRepliesPanel({ compact = false }: { compact?: boolean }) {
  const [replies, setReplies] = useState<SupportQuickReply[]>([]);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const url = q.trim()
      ? `/api/support/quick-replies?q=${encodeURIComponent(q)}`
      : "/api/support/quick-replies";
    void fetch(url)
      .then((r) => r.json())
      .then((d) => setReplies(d.replies ?? []));
  }, [q]);

  async function copy(id: string, body: string) {
    const text = editing[id] ?? body;
    await navigator.clipboard.writeText(text);
    setCopied(id);
    window.setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search quick replies…"
          className="w-full rounded-xl border border-navy/15 py-2.5 pl-9 pr-3 text-sm"
        />
      </div>
      <div className="space-y-2">
        {replies.length === 0 ? (
          <p className="text-sm text-muted">No quick replies found.</p>
        ) : (
          replies.map((reply) => (
            <div
              key={reply.id}
              className="rounded-xl border border-navy/10 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-bold text-navy">{reply.title}</p>
                <button
                  type="button"
                  onClick={() => void copy(reply.id, reply.body)}
                  className="flex shrink-0 items-center gap-1 rounded-lg border border-navy/10 px-2 py-1 text-xs font-semibold text-navy"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copied === reply.id ? "Copied" : "Copy"}
                </button>
              </div>
              <textarea
                value={editing[reply.id] ?? reply.body}
                onChange={(e) =>
                  setEditing((prev) => ({ ...prev, [reply.id]: e.target.value }))
                }
                rows={compact ? 3 : 4}
                className="mt-2 w-full resize-y rounded-lg border border-navy/10 px-3 py-2 text-sm text-foreground"
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
