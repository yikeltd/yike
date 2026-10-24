"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Phone, PhoneOff, Video } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { isNativeMarketplaceContactEnabled } from "@/lib/marketplace/native-contact";
import {
  finalizeVideoCallSession,
  type VideoCallTerminalStatus,
} from "@/lib/video-calls/client";

type IncomingCall = {
  id: string;
  call_type: "voice" | "video";
  status: "ringing" | "connected";
  caller_id: string;
  listing_id: string | null;
  created_at: string;
  connected_at: string | null;
  caller_label: string;
};

const POLL_MS = 4000;
/** Callee-side ring timeout before marking missed (server still authoritative on finalize). */
const RING_TIMEOUT_MS = 45_000;

export function IncomingVideoCallHost() {
  const { user } = useAuth();
  const [call, setCall] = useState<IncomingCall | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const finalizingRef = useRef(false);
  const ringDeadlineRef = useRef<number | null>(null);
  const activeSessionRef = useRef<string | null>(null);
  const tokenLoadedForRef = useRef<string | null>(null);

  const clearLocal = useCallback(() => {
    activeSessionRef.current = null;
    ringDeadlineRef.current = null;
    tokenLoadedForRef.current = null;
    setCall(null);
    setAccepted(false);
    setNotice(null);
  }, []);

  const finalizeOnce = useCallback(
    async (sessionId: string, status: VideoCallTerminalStatus) => {
      if (finalizingRef.current) return;
      finalizingRef.current = true;
      try {
        await finalizeVideoCallSession(sessionId, status);
      } finally {
        finalizingRef.current = false;
        if (activeSessionRef.current === sessionId) {
          clearLocal();
        }
      }
    },
    [clearLocal]
  );

  const poll = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/video-calls/incoming", { cache: "no-store" });
      if (res.status === 401) return;
      const json = (await res.json()) as { calls?: IncomingCall[]; error?: string };
      if (!res.ok) return;

      const next = json.calls?.[0] ?? null;
      if (!next) {
        if (activeSessionRef.current) clearLocal();
        return;
      }

      if (activeSessionRef.current !== next.id) {
        activeSessionRef.current = next.id;
        ringDeadlineRef.current = null;
        tokenLoadedForRef.current = null;
        setAccepted(false);
        setNotice(null);
      }
      setCall(next);

      if (next.status === "ringing") {
        if (!ringDeadlineRef.current) {
          ringDeadlineRef.current = new Date(next.created_at).getTime() + RING_TIMEOUT_MS;
        }
        const deadline = ringDeadlineRef.current;
        if (deadline && Date.now() > deadline) {
          void finalizeOnce(next.id, "missed");
        }
      } else {
        ringDeadlineRef.current = null;
        if (accepted && tokenLoadedForRef.current !== next.id) {
          tokenLoadedForRef.current = next.id;
          const tokenRes = await fetch(
            `/api/video-calls/${encodeURIComponent(next.id)}/token`
          );
          const tokenJson = (await tokenRes.json()) as {
            provider?: { configured?: boolean; channelName?: string; token?: string };
            error?: string;
          };
          if (tokenRes.ok && tokenJson.provider?.configured && tokenJson.provider.channelName) {
            setNotice(`Connected — channel ${tokenJson.provider.channelName}.`);
          } else if (tokenRes.ok) {
            setNotice("Call connected. Media is not configured in this environment.");
          }
        }
      }
    } catch {
      /* ignore transient network errors */
    }
  }, [user, accepted, clearLocal, finalizeOnce]);

  useEffect(() => {
    if (!user || !isNativeMarketplaceContactEnabled()) return;
    void poll();
    const id = window.setInterval(() => void poll(), POLL_MS);
    return () => window.clearInterval(id);
  }, [user, poll]);

  useEffect(() => {
    return () => {
      const sessionId = activeSessionRef.current;
      if (!sessionId) return;
      if (accepted) {
        void finalizeVideoCallSession(
          sessionId,
          call?.status === "connected" ? "ended" : "cancelled"
        );
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cleanup reads latest call status once on unmount
  }, [accepted, call?.status]);

  if (!user || !isNativeMarketplaceContactEnabled() || !call) {
    return null;
  }

  const isRinging = call.status === "ringing";
  const isConnected = call.status === "connected";
  const Icon = call.call_type === "video" ? Video : Phone;

  async function onDecline() {
    setBusy(true);
    try {
      await finalizeOnce(call!.id, "declined");
    } finally {
      setBusy(false);
    }
  }

  async function onAccept() {
    setAccepted(true);
    setNotice(isConnected ? null : "Connecting…");
    if (isConnected) {
      setBusy(true);
      try {
        await poll();
      } finally {
        setBusy(false);
      }
    }
  }

  async function onEnd() {
    setBusy(true);
    try {
      await finalizeOnce(call!.id, "ended");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-x-0 bottom-20 z-[60] mx-auto max-w-md px-4 sm:bottom-6"
      role="dialog"
      aria-label="Incoming call"
    >
      <div className="rounded-2xl border border-navy/10 bg-white p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold/25 text-navy">
            <Icon className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-navy">
              {isRinging ? "Incoming" : "Active"}{" "}
              {call.call_type === "video" ? "video" : "voice"} call
            </p>
            <p className="truncate text-sm text-navy/70">{call.caller_label}</p>
            {notice ? <p className="mt-1 text-xs text-navy/60">{notice}</p> : null}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {isRinging && !accepted ? (
            <>
              <button
                type="button"
                disabled={busy}
                className="pressable flex-1 rounded-xl bg-gold px-3 py-2.5 text-sm font-bold text-navy"
                onClick={() => void onAccept()}
              >
                Accept
              </button>
              <button
                type="button"
                disabled={busy}
                className="pressable inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-200 px-3 py-2.5 text-sm font-semibold text-red-800"
                onClick={() => void onDecline()}
              >
                <PhoneOff className="h-4 w-4" aria-hidden />
                Decline
              </button>
            </>
          ) : null}

          {(isConnected || accepted) && (
            <>
              {!isConnected && accepted ? (
                <p className="w-full text-xs text-navy/60">Waiting for caller to connect…</p>
              ) : null}
              {isConnected ? (
                <button
                  type="button"
                  disabled={busy}
                  className="pressable w-full rounded-xl bg-navy px-3 py-2.5 text-sm font-bold text-white"
                  onClick={() => void onEnd()}
                >
                  End call
                </button>
              ) : null}
              {isRinging && accepted ? (
                <button
                  type="button"
                  disabled={busy}
                  className="pressable w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm font-semibold text-navy"
                  onClick={() => void finalizeOnce(call.id, "cancelled")}
                >
                  Cancel
                </button>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
