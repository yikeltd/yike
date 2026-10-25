"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AgoraCallRoom } from "@/components/marketplace/agora-call-room";
import {
  finalizeVideoCallSession,
  type VideoCallTerminalStatus,
} from "@/lib/video-calls/client";

type Message = {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

type ConversationMeta = {
  id: string;
  listing_id: string;
  asset_type: string;
  buyer_id: string;
  seller_id: string;
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
  const [meta, setMeta] = useState<ConversationMeta | null>(null);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [listingHref, setListingHref] = useState<string | null>(null);
  const [listingTitle, setListingTitle] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedBody, setLastFailedBody] = useState<string | null>(null);
  const [callNotice, setCallNotice] = useState<string | null>(null);
  const [mediaSessionId, setMediaSessionId] = useState<string | null>(null);

  const loadMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not load messages");
        return;
      }
      setMessages(json.messages ?? []);
    } catch {
      setError("Could not load messages");
    }
  }, [conversationId]);

  const loadMeta = useCallback(async () => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not load conversation");
        return;
      }
      setMeta(json.conversation ?? null);
      setPeerId(json.peerId ?? null);
      setListingHref(json.listingHref ?? null);
      setListingTitle(json.listingTitle ?? null);
    } catch {
      setError("Could not load conversation");
    }
  }, [conversationId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      await Promise.all([loadMeta(), loadMessages()]);
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadMeta, loadMessages]);

  useEffect(() => {
    const id = window.setInterval(() => {
      void loadMessages();
    }, 5000);
    return () => window.clearInterval(id);
  }, [loadMessages]);

  async function sendMessageText(text: string, clientMessageId?: string) {
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: text,
          clientMessageId:
            clientMessageId ??
            (typeof crypto !== "undefined" && crypto.randomUUID
              ? crypto.randomUUID()
              : `msg-${Date.now()}`),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Send failed");
        setLastFailedBody(text);
        return;
      }
      setLastFailedBody(null);
      setBody("");
      setMessages((prev) => [...prev, json.message]);
    } finally {
      setSending(false);
    }
  }

  async function send() {
    const text = body.trim();
    if (!text) return;
    await sendMessageText(text);
  }

  async function finalizeCall(sessionId: string, status: VideoCallTerminalStatus) {
    await finalizeVideoCallSession(sessionId, status);
    setMediaSessionId(null);
  }

  async function startVideoCall() {
    if (!meta || !peerId) return;
    setCallNotice(null);
    const pre = await fetch("/api/video-calls/preflight");
    const preJson = await pre.json();
    if (!pre.ok) {
      setCallNotice(preJson.error ?? "Video calls unavailable");
      return;
    }
    if (preJson.billable && preJson.priceCoins != null) {
      const ok = window.confirm(
        `This video call costs ${preJson.priceCoins} Yike Coins. Balance: ${preJson.balanceCoins}. Continue?`,
      );
      if (!ok) return;
    }

    const idempotencyKey =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `call-${Date.now()}`;

    const startRes = await fetch("/api/video-calls/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        calleeId: peerId,
        listingId: meta.listing_id,
        conversationId: meta.id,
        callType: "video",
        idempotencyKey,
      }),
    });
    const startJson = await startRes.json();
    if (!startRes.ok) {
      setCallNotice(startJson.error ?? "Could not start call");
      return;
    }

    const sessionId = startJson.session.id as string;
    const connectRes = await fetch(`/api/video-calls/${sessionId}/connect`, {
      method: "POST",
    });
    const connectJson = await connectRes.json();
    if (!connectRes.ok) {
      await finalizeCall(sessionId, "failed");
      setCallNotice(connectJson.error ?? "Could not connect call");
      return;
    }
    if (!connectJson.provider?.configured || !connectJson.provider?.token) {
      await finalizeCall(sessionId, "failed");
      setCallNotice("Call authorized but Agora media is not configured locally.");
      return;
    }
    setMediaSessionId(sessionId);
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

      {meta ? (
        <div className="rounded-xl border border-navy/10 bg-white px-3 py-2 text-xs text-navy/70">
          Listing conversation ·{" "}
          {listingHref ? (
            <Link href={listingHref} className="font-semibold text-navy underline-offset-2 hover:underline">
              {listingTitle ?? "View listing"}
            </Link>
          ) : (
            meta.listing_id
          )}
        </div>
      ) : null}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => void startVideoCall()}
          disabled={!peerId || !!mediaSessionId}
          className="pressable rounded-xl border border-navy/15 px-3 py-2 text-xs font-bold text-navy disabled:opacity-50"
        >
          Video call
        </button>
      </div>

      {callNotice ? <p className="text-xs text-amber-800">{callNotice}</p> : null}

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

      {error ? (
        <div className="space-y-2">
          <p className="text-xs text-red-700">{error}</p>
          {lastFailedBody ? (
            <button
              type="button"
              className="pressable text-xs font-bold text-navy underline"
              onClick={() => void sendMessageText(lastFailedBody, undefined)}
            >
              Retry last message
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="flex gap-2">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a message…"
          className="flex-1 rounded-xl border border-navy/15 px-3 py-2.5 text-sm"
          maxLength={4000}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
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

      {mediaSessionId ? (
        <AgoraCallRoom
          sessionId={mediaSessionId}
          label="Listing video call"
          onHangUp={() => void finalizeCall(mediaSessionId, "ended")}
        />
      ) : null}
    </div>
  );
}
