"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Phone, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-provider";
import type { MarketplaceAssetType } from "@/lib/marketplace-messaging/service";
import { isNativeMarketplaceContactEnabled } from "@/lib/marketplace/native-contact";
import {
  finalizeVideoCallSession,
  type VideoCallTerminalStatus,
} from "@/lib/video-calls/client";
import { AgoraCallRoom } from "@/components/marketplace/agora-call-room";

type Props = {
  listingId: string;
  assetType: MarketplaceAssetType;
  sellerId: string;
  sellerName: string;
  layout?: "detail" | "compact";
  className?: string;
};

export function ListingInquiryActions({
  listingId,
  assetType,
  sellerId,
  sellerName,
  layout = "detail",
  className,
}: Props) {
  const { guardAction, user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [phoneInfo, setPhoneInfo] = useState<{ telUrl?: string; message?: string } | null>(
    null
  );
  const [callNotice, setCallNotice] = useState<string | null>(null);
  const [backendReady, setBackendReady] = useState<boolean | null>(null);
  const [backendReason, setBackendReason] = useState<string | null>(null);
  const [activeCallSessionId, setActiveCallSessionId] = useState<string | null>(null);
  const [mediaSessionId, setMediaSessionId] = useState<string | null>(null);
  const activeCallSessionRef = useRef<string | null>(null);

  async function finalizeActiveCall(status: VideoCallTerminalStatus) {
    const sessionId = activeCallSessionRef.current;
    if (!sessionId) return;
    await finalizeVideoCallSession(sessionId, status);
    if (activeCallSessionRef.current === sessionId) {
      activeCallSessionRef.current = null;
      setActiveCallSessionId(null);
    }
  }

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/marketplace/native-contact/status")
      .then((r) => r.json())
      .then((json: { messagingAvailable?: boolean; reason?: string | null }) => {
        if (cancelled) return;
        setBackendReady(Boolean(json.messagingAvailable));
        setBackendReason(json.reason ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setBackendReady(false);
          setBackendReason("Could not verify in-app contact availability.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      const sessionId = activeCallSessionRef.current;
      if (sessionId) {
        void finalizeVideoCallSession(sessionId, "cancelled");
      }
    };
  }, []);

  if (!isNativeMarketplaceContactEnabled()) {
    return null;
  }

  const messagingDisabled = backendReady === false;

  async function startConversation() {
    setLoading("message");
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, assetType }),
      });
      const json = await res.json();
      if (!res.ok) {
        setCallNotice(json.error ?? "Could not start conversation");
        return;
      }
      router.push(`/conversations/${json.conversation.id}`);
    } finally {
      setLoading(null);
    }
  }

  async function revealPhone() {
    setLoading("phone");
    try {
      const res = await fetch(
        `/api/listings/${encodeURIComponent(listingId)}/seller-contact?sellerId=${encodeURIComponent(sellerId)}`
      );
      const json = await res.json();
      if (!res.ok) {
        setPhoneInfo({ message: json.error ?? "Phone unavailable" });
        return;
      }
      if (json.phoneReveal?.telUrl) {
        setPhoneInfo({ telUrl: json.phoneReveal.telUrl });
      } else {
        setPhoneInfo({ message: json.phoneReveal?.message });
      }
    } finally {
      setLoading(null);
    }
  }

  async function startCall(callType: "voice" | "video") {
    setLoading(callType);
    setCallNotice(null);
    try {
      if (callType === "video") {
        const pre = await fetch("/api/video-calls/preflight");
        const preJson = await pre.json();
        if (!pre.ok) {
          setCallNotice(preJson.error ?? "Video calls unavailable");
          return;
        }
        if (preJson.billable) {
          if (preJson.priceCoins == null) {
            setCallNotice("Video call pricing is awaiting approval.");
            return;
          }
          const ok = window.confirm(
            `This video call costs ${preJson.priceCoins} Yike Coins. Balance: ${preJson.balanceCoins}. Continue?`
          );
          if (!ok) return;
        }
      }

      const idempotencyKey =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `call-${Date.now()}`;

      const startRes = await fetch("/api/video-calls/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calleeId: sellerId,
          listingId,
          callType,
          idempotencyKey,
        }),
      });
      const startJson = await startRes.json();
      if (!startRes.ok) {
        setCallNotice(startJson.error ?? "Could not start call");
        return;
      }

      const sessionId = startJson.session.id as string;
      activeCallSessionRef.current = sessionId;
      setActiveCallSessionId(sessionId);

      const connectRes = await fetch(
        `/api/video-calls/${sessionId}/connect`,
        { method: "POST" }
      );
      const connectJson = await connectRes.json();
      if (!connectRes.ok) {
        await finalizeVideoCallSession(sessionId, "failed");
        activeCallSessionRef.current = null;
        setActiveCallSessionId(null);
        setCallNotice(connectJson.error ?? "Could not connect call");
        return;
      }
      const provider = connectJson.provider;
      if (!provider?.configured || !provider?.token) {
        await finalizeVideoCallSession(sessionId, "failed");
        activeCallSessionRef.current = null;
        setActiveCallSessionId(null);
        setCallNotice(
          "Call connected in Yike but live media is not configured (Agora credentials missing)."
        );
        return;
      }
      setMediaSessionId(sessionId);
      setCallNotice(`Calling ${sellerName}…`);
    } finally {
      setLoading(null);
    }
  }

  const btnClass =
    layout === "compact"
      ? "pressable flex-1 rounded-xl bg-navy px-3 py-2.5 text-sm font-bold text-white"
      : "pressable w-full rounded-xl bg-gold px-4 py-3 text-sm font-black text-navy";

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {messagingDisabled && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-snug text-amber-950">
          {backendReason ??
            "In-app messaging and calls are temporarily unavailable on this environment."}
        </p>
      )}
      <button
        type="button"
        className={btnClass}
        disabled={!!loading || messagingDisabled || backendReady === null}
        onClick={() =>
          guardAction({ type: "message", listingId, redirectPath: window.location.pathname }, () =>
            void startConversation()
          )
        }
      >
        <span className="inline-flex items-center justify-center gap-2">
          <MessageCircle className="h-4 w-4" />
          {loading === "message" ? "Opening…" : "Message seller"}
        </span>
      </button>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className="pressable rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm font-semibold text-navy"
          disabled={!!loading || messagingDisabled || backendReady === null}
          onClick={() =>
            guardAction({ type: "call", listingId }, () => void startCall("voice"))
          }
        >
          <span className="inline-flex items-center justify-center gap-1.5">
            <Phone className="h-4 w-4" />
            Voice
          </span>
        </button>
        <button
          type="button"
          className="pressable rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm font-semibold text-navy"
          disabled={!!loading || messagingDisabled || backendReady === null}
          onClick={() =>
            guardAction({ type: "call", listingId }, () => void startCall("video"))
          }
        >
          <span className="inline-flex items-center justify-center gap-1.5">
            <Video className="h-4 w-4" />
            Video
          </span>
        </button>
      </div>

      {user && (
        <button
          type="button"
          className="pressable text-sm font-semibold text-navy/70 underline-offset-2 hover:underline"
          disabled={!!loading}
          onClick={() => guardAction({ type: "call", listingId }, () => void revealPhone())}
        >
          {loading === "phone" ? "Checking plan…" : "Show phone number"}
        </button>
      )}

      {phoneInfo?.telUrl && (
        <a
          href={phoneInfo.telUrl}
          className="pressable rounded-xl bg-navy/5 px-3 py-2 text-center text-sm font-bold text-navy"
        >
          Call seller
        </a>
      )}
      {phoneInfo?.message && (
        <p className="text-xs leading-relaxed text-navy/60">{phoneInfo.message}</p>
      )}
      {callNotice && <p className="text-xs text-amber-800">{callNotice}</p>}

      {mediaSessionId ? (
        <AgoraCallRoom
          sessionId={mediaSessionId}
          label={`Call with ${sellerName}`}
          onHangUp={() => {
            void finalizeActiveCall("ended");
            setMediaSessionId(null);
          }}
        />
      ) : null}

      {activeCallSessionId && !mediaSessionId && (
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            className="pressable rounded-lg border border-navy/15 px-3 py-2 text-xs font-semibold text-navy"
            disabled={!!loading}
            onClick={() => void finalizeActiveCall("ended")}
          >
            End call
          </button>
          <button
            type="button"
            className="pressable rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-800"
            disabled={!!loading}
            onClick={() => void finalizeActiveCall("cancelled")}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
