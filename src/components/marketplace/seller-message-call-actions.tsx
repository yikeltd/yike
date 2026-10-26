"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageCircle, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-provider";
import type { MarketplaceAssetType } from "@/lib/marketplace-messaging/service";

type Props = {
  listingId: string;
  assetType: MarketplaceAssetType;
  sellerId: string;
  sellerName: string;
  className?: string;
  variant?: "sidebar" | "gallery-inline";
};

type PhoneState =
  | { phase: "guest" }
  | { phase: "loading" }
  | { phase: "ready"; telUrl: string }
  | { phase: "unavailable" };

function listingReturnPath(fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return `${window.location.pathname}${window.location.search}`;
}

export function SellerMessageCallActions({
  listingId,
  assetType,
  sellerId,
  sellerName,
  className,
  variant = "sidebar",
}: Props) {
  const { guardAction, user } = useAuth();
  const router = useRouter();
  const [messageLoading, setMessageLoading] = useState(false);
  const [messageNotice, setMessageNotice] = useState<string | null>(null);
  const [messagingReady, setMessagingReady] = useState<boolean | null>(null);
  const [phone, setPhone] = useState<PhoneState>({ phase: "guest" });

  const compact = variant === "gallery-inline";
  const returnPath = listingReturnPath(`/${listingId}`);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/marketplace/native-contact/status")
      .then((r) => r.json())
      .then((json: { messagingAvailable?: boolean }) => {
        if (cancelled) return;
        setMessagingReady(Boolean(json.messagingAvailable));
      })
      .catch(() => {
        if (!cancelled) setMessagingReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;
    void (async () => {
      setPhone({ phase: "loading" });
      try {
        const contactQs = new URLSearchParams({
          sellerId,
          assetType,
        });
        const res = await fetch(
          `/api/listings/${encodeURIComponent(listingId)}/seller-contact?${contactQs.toString()}`,
        );
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok || !json.phoneReveal?.telUrl) {
          setPhone({ phase: "unavailable" });
          return;
        }
        setPhone({ phase: "ready", telUrl: json.phoneReveal.telUrl as string });
      } catch {
        if (!cancelled) setPhone({ phase: "unavailable" });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [listingId, sellerId, user?.id, assetType]);

  const effectivePhone: PhoneState = !user?.id ? { phase: "guest" } : phone;

  async function startConversation() {
    setMessageNotice(null);
    setMessageLoading(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, assetType }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMessageNotice(json.error ?? "Could not open conversation");
        return;
      }
      router.push(`/conversations/${json.conversation.id}`);
    } finally {
      setMessageLoading(false);
    }
  }

  function onMessageClick() {
    guardAction(
      {
        type: "message",
        listingId,
        redirectPath: returnPath,
      },
      () => void startConversation(),
    );
  }

  function onCallClick() {
    guardAction(
      {
        type: "call",
        listingId,
        redirectPath: returnPath,
      },
      () => {
        if (effectivePhone.phase === "ready") {
          window.location.href = effectivePhone.telUrl;
        }
      },
    );
  }

  const messagingDisabled = messagingReady === false || messagingReady === null;
  const callReady = effectivePhone.phase === "ready";
  const callUnavailable =
    Boolean(user?.id) &&
    (effectivePhone.phase === "unavailable" || effectivePhone.phase === "loading");

  const messageLabel = messageLoading ? (compact ? "…" : "Opening…") : "Message";
  const callLabel = callUnavailable
    ? effectivePhone.phase === "loading"
      ? compact
        ? "…"
        : "Call"
      : "Call unavailable"
    : "Call";

  const btnBase = compact
    ? "min-h-[44px] rounded-xl px-3 py-2.5 text-xs font-bold"
    : "min-h-[44px] rounded-2xl px-4 py-3 text-sm font-bold";

  return (
    <div className={cn("space-y-2", className)}>
      {messagingDisabled && messagingReady === false ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-snug text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          In-app messaging is temporarily unavailable on this environment.
        </p>
      ) : null}
      {messageNotice ? (
        <p className="text-[11px] leading-snug text-amber-900 dark:text-amber-200">
          {messageNotice}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          disabled={messageLoading || messagingDisabled || !sellerId}
          onClick={onMessageClick}
          aria-label={`Message ${sellerName}`}
          className={cn(
            "pressable col-span-1 flex w-full items-center justify-center gap-1.5 bg-[#031B4E] text-white shadow-md transition-colors hover:bg-navy/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 disabled:cursor-not-allowed disabled:opacity-50",
            btnBase,
          )}
        >
          <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
          <span>{messageLabel}</span>
        </button>

        {callReady && effectivePhone.phase === "ready" ? (
          <Link
            href={effectivePhone.telUrl}
            onClick={(e) => {
              if (!user) {
                e.preventDefault();
                onCallClick();
              }
            }}
            aria-label={`Call ${sellerName}`}
            className={cn(
              "pressable flex w-full items-center justify-center gap-1.5 border-2 border-[#031B4E] bg-white text-[#031B4E] shadow-sm ring-1 ring-gold/30 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 dark:border-white/25 dark:bg-transparent dark:text-white dark:hover:bg-white/5",
              btnBase,
            )}
          >
            <Phone
              className="h-4 w-4 shrink-0 text-gold-dark dark:text-gold"
              aria-hidden
            />
            <span>Call</span>
          </Link>
        ) : (
          <button
            type="button"
            disabled={Boolean(callUnavailable)}
            onClick={onCallClick}
            aria-label={callUnavailable ? "Call unavailable" : `Call ${sellerName}`}
            className={cn(
              "pressable flex w-full items-center justify-center gap-1.5 border-2 bg-white shadow-sm ring-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 disabled:cursor-not-allowed",
              callUnavailable
                ? "border-[#031B4E]/25 text-[#031B4E]/45 ring-gold/10 opacity-70 dark:border-white/10 dark:text-white/35"
                : "border-[#031B4E] text-[#031B4E] ring-gold/30 hover:bg-slate-50 dark:border-white/25 dark:bg-transparent dark:text-white dark:hover:bg-white/5",
              btnBase,
            )}
          >
            <Phone className="h-4 w-4 shrink-0" aria-hidden />
            <span>{callLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
}
