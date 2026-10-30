"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageCircle, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-provider";
import type { MarketplaceAssetType } from "@/lib/marketplace-messaging/service";
import type { ListingContactContext } from "@/lib/marketplace/listing-inquiry-message";
import {
  openWhatsAppLead,
  trackLeadAndRedirect,
} from "@/lib/leads/client";
import type { ContactPlacement } from "@/lib/contact-tracking";

type Props = {
  listingId: string;
  assetType: MarketplaceAssetType;
  sellerId: string;
  sellerName: string;
  contact: ListingContactContext;
  placement?: ContactPlacement;
  className?: string;
  variant?: "sidebar" | "gallery-inline";
};

type PhoneState =
  | { phase: "guest" }
  | { phase: "loading" }
  | { phase: "ready"; telUrl: string }
  | { phase: "unavailable"; message?: string };

function listingReturnPath(fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return `${window.location.pathname}${window.location.search}`;
}

export function SellerMessageCallActions({
  listingId,
  assetType,
  sellerId,
  sellerName,
  contact,
  placement = "detail",
  className,
  variant = "sidebar",
}: Props) {
  const { guardAction, user } = useAuth();
  const router = useRouter();
  const [messageLoading, setMessageLoading] = useState(false);
  const [callLoading, setCallLoading] = useState(false);
  const [messageNotice, setMessageNotice] = useState<string | null>(null);
  const [messagingReady, setMessagingReady] = useState<boolean | null>(null);
  const [messagingReason, setMessagingReason] = useState<string | null>(null);
  const [phone, setPhone] = useState<PhoneState>({ phase: "guest" });
  const inFlightRef = useRef<string | null>(null);

  const compact = variant === "gallery-inline";
  const returnPath = listingReturnPath(contact.listingUrl || `/${listingId}`);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/marketplace/native-contact/status")
      .then((r) => r.json())
      .then((json: { messagingAvailable?: boolean; reason?: string | null }) => {
        if (cancelled) return;
        setMessagingReady(Boolean(json.messagingAvailable));
        setMessagingReason(json.reason ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setMessagingReady(false);
          setMessagingReason("Could not verify in-app messaging.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setPhone({ phase: "guest" });
      return;
    }

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
        if (res.ok && json.phoneReveal?.telUrl) {
          setPhone({ phase: "ready", telUrl: json.phoneReveal.telUrl as string });
          return;
        }
        const msg =
          typeof json.phoneReveal?.message === "string"
            ? json.phoneReveal.message
            : undefined;
        setPhone({ phase: "unavailable", message: msg });
      } catch {
        if (!cancelled) setPhone({ phase: "unavailable" });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [listingId, sellerId, user?.id, assetType]);

  const effectivePhone: PhoneState = !user?.id ? { phase: "guest" } : phone;

  async function runWhatsAppLead() {
    const key = `wa-${listingId}`;
    if (inFlightRef.current === key) return;
    inFlightRef.current = key;
    setMessageNotice(null);
    setMessageLoading(true);
    try {
      const result = await trackLeadAndRedirect({
        listingId,
        agentId: sellerId,
        leadType: "whatsapp",
        sourcePage: returnPath,
        placement,
        agentName: sellerName,
        title: contact.title,
        area: contact.area,
        city: contact.city,
        price: contact.price,
        paymentPeriod: contact.paymentPeriod,
        listingType: contact.listingType,
        bedrooms: contact.bedrooms,
        propertyType: contact.propertyType,
        assetType,
        listingUrl: contact.listingUrl,
      } as Parameters<typeof trackLeadAndRedirect>[0]);
      if (!result.ok) {
        setMessageNotice(result.error ?? "Could not send message");
        return;
      }
      if (result.redirectUrl) openWhatsAppLead(result);
    } finally {
      setMessageLoading(false);
      inFlightRef.current = null;
    }
  }

  async function startConversation() {
    const key = `msg-${listingId}`;
    if (inFlightRef.current === key) return;
    inFlightRef.current = key;
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
      inFlightRef.current = null;
    }
  }

  async function runCallLead() {
    const key = `call-${listingId}`;
    if (inFlightRef.current === key) return;
    inFlightRef.current = key;
    setMessageNotice(null);
    setCallLoading(true);
    try {
      const result = await trackLeadAndRedirect({
        listingId,
        agentId: sellerId,
        leadType: "call",
        sourcePage: returnPath,
        placement,
        agentName: sellerName,
        title: contact.title,
        area: contact.area,
        city: contact.city,
        price: contact.price,
        paymentPeriod: contact.paymentPeriod,
        listingType: contact.listingType,
        bedrooms: contact.bedrooms,
        propertyType: contact.propertyType,
        assetType,
        listingUrl: contact.listingUrl,
      } as Parameters<typeof trackLeadAndRedirect>[0]);
      if (!result.ok) {
        setMessageNotice(result.error ?? "Call unavailable");
        return;
      }
      if (result.callAllowed && result.redirectUrl) {
        window.location.href = result.redirectUrl;
        return;
      }
      if (result.redirectUrl) {
        openWhatsAppLead(result);
        setMessageNotice("Direct call unavailable — use Message to reach the seller.");
        return;
      }
      setMessageNotice("Call unavailable for this listing.");
    } finally {
      setCallLoading(false);
      inFlightRef.current = null;
    }
  }

  function onMessageClick() {
    guardAction(
      {
        type: usesInAppChat ? "message" : "whatsapp",
        listingId,
        redirectPath: returnPath,
      },
      () => {
        if (usesInAppChat) {
          void startConversation();
        } else {
          void runWhatsAppLead();
        }
      },
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
          return;
        }
        void runCallLead();
      },
    );
  }

  const callReady = effectivePhone.phase === "ready";
  const callBusy = callLoading || effectivePhone.phase === "loading";
  const callUnavailable =
    Boolean(user?.id) && effectivePhone.phase === "unavailable" && !callLoading;

  const usesInAppChat = messagingReady === true;
  const messageLabel = messageLoading
    ? compact
      ? "…"
      : "Opening…"
    : "Message";

  const callLabel = callBusy
    ? compact
      ? "…"
      : "Call"
    : callUnavailable
      ? compact
        ? "No number"
        : "Call unavailable"
      : "Call";

  const btnBase = compact
    ? "min-h-[44px] rounded-xl px-3 py-2.5 text-xs font-bold"
    : "min-h-[44px] rounded-2xl px-4 py-3 text-sm font-bold";

  return (
    <div className={cn("space-y-2", className)}>
      {messagingReady === false && messagingReason ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-snug text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          {messagingReason} Tap Message to contact the seller.
        </p>
      ) : null}
      {callUnavailable && effectivePhone.message ? (
        <p className="text-[11px] leading-snug text-muted">{effectivePhone.message}</p>
      ) : null}
      {messageNotice ? (
        <p className="text-[11px] leading-snug text-amber-900 dark:text-amber-200">
          {messageNotice}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          disabled={messageLoading || !sellerId}
          onClick={onMessageClick}
          aria-label={`Message ${sellerName}`}
          className={cn(
            "pressable col-span-1 flex w-full items-center justify-center gap-1.5 bg-navy text-white shadow-md transition-colors hover:bg-navy/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 disabled:cursor-not-allowed disabled:opacity-50",
            btnBase,
          )}
        >
          <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
          <span>{messageLabel}</span>
        </button>

        {callReady ? (
          <Link
            href={effectivePhone.telUrl}
            onClick={(e) => {
              if (!user?.id) {
                e.preventDefault();
                onCallClick();
              }
            }}
            aria-label={`Call ${sellerName}`}
            className={cn(
              "pressable flex w-full items-center justify-center gap-1.5 border-2 border-navy bg-elevated text-navy shadow-sm ring-1 ring-gold/30 transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 dark:border-white/25 dark:bg-transparent dark:text-white dark:hover:bg-white/5",
              btnBase,
            )}
          >
            <Phone className="h-4 w-4 shrink-0 text-gold-dark dark:text-gold" aria-hidden />
            <span>Call</span>
          </Link>
        ) : (
          <button
            type="button"
            disabled={callBusy || (callUnavailable && !user)}
            onClick={onCallClick}
            aria-label={callUnavailable ? "Call unavailable" : `Call ${sellerName}`}
            className={cn(
              "pressable flex w-full items-center justify-center gap-1.5 border-2 bg-elevated shadow-sm ring-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 disabled:cursor-not-allowed",
              callUnavailable
                ? "border-navy/20 text-navy/45 ring-gold/10 opacity-80 dark:border-white/10 dark:text-white/35"
                : "border-navy text-navy ring-gold/30 hover:bg-surface dark:border-white/25 dark:bg-transparent dark:text-white dark:hover:bg-white/5",
              btnBase,
              callBusy && "opacity-70",
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
