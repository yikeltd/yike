"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Message = {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export function MarketplaceThread({
  conversationId,
  currentUserId,
}: {
  conversationId: string;
  currentUserId: string;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not load messages");
        return;
      }
      setMessages(json.messages ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [conversationId]);

  async function send() {
    const text = body.trim();
    if (!text) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Send failed");
        return;
      }
      setBody("");
      setMessages((prev) => [...prev, json.message]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70dvh] max-w-2xl flex-col gap-4 px-4 py-6">
      <button
        type="button"
        className="pressable self-start text-sm font-semibold text-navy/70"
        onClick={() => router.push("/conversations")}
      >
        ← Inbox
      </button>

      <div className="flex-1 space-y-3 rounded-2xl border border-navy/10 bg-white p-4">
        {loading ? (
          <p className="text-sm text-muted">Loading messages…</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted">No messages yet. Say hello to the seller.</p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={
                m.sender_id === currentUserId
                  ? "ml-8 rounded-2xl bg-gold/20 px-3 py-2 text-sm text-navy"
                  : "mr-8 rounded-2xl bg-surface px-3 py-2 text-sm text-navy"
              }
            >
              {m.body}
              <div className="mt-1 text-[10px] text-muted">
                {new Date(m.created_at).toLocaleTimeString("en-NG", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {error ? <p className="text-xs text-red-700">{error}</p> : null}

      <div className="flex gap-2">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a message…"
          className="flex-1 rounded-xl border border-navy/15 px-3 py-2.5 text-sm"
          maxLength={4000}
        />
        <button
          type="button"
          disabled={sending}
          onClick={() => void send()}
          className="pressable rounded-xl bg-navy px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {sending ? "…" : "Send"}
        </button>
      </div>
    </div>
  );
}
