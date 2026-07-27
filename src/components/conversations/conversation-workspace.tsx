"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MessageSquare, PhoneCall, Send, Shield, Sparkles } from "lucide-react";
import type { ConversationWorkspace as WorkspaceType, TransactionActionType } from "@/lib/conversations/types";
import { ConnectActionSheet } from "./connect-action-sheet";
import { ConversationTimeline } from "./conversation-timeline";
import { TransactionActionBar } from "./transaction-action-bar";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function ConversationWorkspace({
  conversationId,
  currentUserId,
}: {
  conversationId: string;
  currentUserId: string;
}) {
  const [workspace, setWorkspace] = useState<WorkspaceType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);
  const [connectSheetOpen, setConnectSheetOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch(`/api/conversations/${encodeURIComponent(conversationId)}`);
        const data = (await res.json()) as { workspace?: WorkspaceType; error?: string };
        if (cancelled) return;

        if (!res.ok || !data.workspace) {
          setError(data.error ?? "Failed to load conversation workspace");
          return;
        }

        setWorkspace(data.workspace);
      } catch {
        if (!cancelled) setError("Network error loading conversation workspace");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!messageInput.trim() || sending || !workspace) return;

    setSending(true);
    try {
      const res = await fetch(`/api/conversations/${encodeURIComponent(workspace.id)}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageInput.trim() }),
      });
      const data = (await res.json()) as { workspace?: WorkspaceType };
      setMessageInput("");

      // Refresh workspace data
      const refreshed = await fetch(`/api/conversations/${encodeURIComponent(workspace.id)}`);
      const refData = (await refreshed.json()) as { workspace?: WorkspaceType };
      if (refData.workspace) setWorkspace(refData.workspace);
    } catch {
      // Ignore transient error
    } finally {
      setSending(false);
    }
  }

  async function handleActionClick(action: TransactionActionType) {
    if (!workspace) return;
    try {
      const res = await fetch(`/api/conversations/${encodeURIComponent(workspace.id)}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await res.json()) as { workspace?: WorkspaceType };
      if (data.workspace) {
        setWorkspace(data.workspace);
      }
    } catch {
      // Ignore transient error
    }
  }

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center rounded-3xl border border-navy/10 bg-white p-8">
        <p className="text-sm font-medium text-navy/60">Loading transaction workspace…</p>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center gap-3 rounded-3xl border border-navy/10 bg-white p-8 text-center">
        <p className="text-sm font-bold text-danger">{error ?? "Workspace unavailable"}</p>
        <Link href="/agent" className="text-xs font-bold text-navy underline">
          Return to profile
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[85vh] max-w-5xl flex-col overflow-hidden rounded-3xl border border-navy/10 bg-surface shadow-lg">
      {/* Workspace Header & Listing Summary */}
      <header className="border-b border-navy/10 bg-white p-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/properties/${workspace.listing.slug}`}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy/5 text-navy transition-all hover:bg-navy/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-navy">
                  Transaction Workspace
                </span>
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">
                  · {workspace.status.replace("_", " ")}
                </span>
              </div>
              <h1 className="mt-0.5 text-base font-bold text-navy sm:text-lg">
                {workspace.listing.title}
              </h1>
              <p className="text-xs font-semibold text-navy/70">
                {formatPrice(workspace.listing.price, "total", "rent")} · {workspace.listing.locationLabel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setConnectSheetOpen(true)}
              className="pressable flex items-center gap-1.5 rounded-full bg-gold px-4 py-2 text-xs font-bold text-navy shadow-sm transition-all hover:bg-gold-light"
            >
              <PhoneCall className="h-4 w-4" />
              <span>Connect</span>
            </button>
          </div>
        </div>

        {/* Transaction Summary Bar */}
        <div className="mt-3 flex items-center justify-between rounded-2xl border border-navy/10 bg-navy/5 px-4 py-2.5 text-xs text-navy">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-gold-dark" />
            <span className="font-bold">{workspace.seller.fullName}</span>
            {workspace.seller.badges.map((b) => (
              <span
                key={b.name}
                className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700"
              >
                ✓ {b.label}
              </span>
            ))}
          </div>
          {workspace.scheduledViewingAt ? (
            <span className="font-bold text-emerald-700">
              Viewing: {workspace.scheduledViewingAt}
            </span>
          ) : (
            <span className="font-medium text-navy/60">Inspection: {workspace.inspectionStatus}</span>
          )}
        </div>
      </header>

      {/* Main Conversation Stream */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6">
        <ConversationTimeline
          timeline={workspace.timeline}
          messages={workspace.messages}
          currentUserId={currentUserId}
        />
      </main>

      {/* Transaction Action Bar & Message Input */}
      <footer className="border-t border-navy/10 bg-white p-4">
        <TransactionActionBar
          availableActions={workspace.availableActions}
          onActionClick={(action) => void handleActionClick(action)}
        />

        <form onSubmit={(e) => void handleSendMessage(e)} className="mt-3 flex items-center gap-2">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Type a message or select a transaction action above…"
            className="flex-1 rounded-full border border-navy/10 bg-surface px-4 py-2.5 text-sm font-medium text-navy placeholder:text-navy/40 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
          />
          <button
            type="submit"
            disabled={!messageInput.trim() || sending}
            className="pressable flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy text-white disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </footer>

      {/* Unified Connect Drawer / Sheet */}
      <ConnectActionSheet
        workspace={workspace}
        open={connectSheetOpen}
        onClose={() => setConnectSheetOpen(false)}
        onTriggerAction={(actionName) => void handleActionClick(actionName as TransactionActionType)}
      />
    </div>
  );
}
