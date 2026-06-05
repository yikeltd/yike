"use client";

import { useState } from "react";
import {
  Share2,
  MessageCircle,
  Link2,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";

export function ListingShareMenu({
  title,
  text,
  url,
  price,
  city,
  listingId,
  listingType,
  propertyType,
  className,
}: {
  title: string;
  text: string;
  url: string;
  price?: string;
  city?: string;
  listingId?: string;
  listingType?: string;
  propertyType?: string | null;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const waText = encodeURIComponent(
    `${title}${price ? ` · ${price}` : ""}${city ? ` in ${city}` : ""}\n${url}`
  );
  const waHref = `https://wa.me/?text=${waText}`;
  const fbHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        trackEvent("share_listing", {
          listing_id: listingId,
          city,
          listing_type: listingType,
          property_type: propertyType ?? undefined,
          channel: "native",
        });
        setOpen(false);
        return;
      } catch {
        /* cancelled */
      }
    }
    await copyLink();
  }

  function trackShare(channel: "whatsapp" | "facebook" | "copy") {
    trackEvent(channel === "whatsapp" ? "whatsapp_click" : "share_listing", {
      listing_id: listingId,
      city,
      listing_type: listingType,
      property_type: propertyType ?? undefined,
      channel,
      placement: "share_menu",
    });
  }

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="pressable flex h-10 w-10 items-center justify-center rounded-full bg-elevated/90 shadow-float backdrop-blur-sm"
        aria-label="Share listing"
        aria-expanded={open}
      >
        <Share2 className="h-4 w-4 text-navy" />
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            aria-label="Close share menu"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-12 z-50 min-w-[200px] overflow-hidden rounded-2xl bg-elevated py-1 shadow-float-lg ring-1 ring-black/[0.06] dark:ring-white/[0.08]">
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-foreground hover:bg-surface"
              onClick={() => {
                trackShare("whatsapp");
                setOpen(false);
              }}
            >
              <MessageCircle className="h-4 w-4 text-[#25D366]" />
              WhatsApp
            </a>
            <a
              href={fbHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-foreground hover:bg-surface"
              onClick={() => {
                trackShare("facebook");
                setOpen(false);
              }}
            >
              <Share2 className="h-4 w-4 text-[#1877F2]" />
              Facebook
            </a>
            <button
              type="button"
              onClick={async () => {
                await copyLink();
                trackShare("copy");
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-foreground hover:bg-surface"
            >
              {copied ? (
                <Check className="h-4 w-4 text-gold-dark" />
              ) : (
                <Link2 className="h-4 w-4 text-navy" />
              )}
              {copied ? "Copied!" : "Copy link"}
            </button>
            {"share" in navigator && (
              <button
                type="button"
                onClick={nativeShare}
                className="flex w-full items-center gap-3 border-t border-surface px-4 py-3 text-left text-sm font-semibold text-foreground hover:bg-surface"
              >
                <Share2 className="h-4 w-4 text-gold-dark" />
                Share…
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/** @deprecated Use ListingShareMenu */
export function ShareButton(
  props: React.ComponentProps<typeof ListingShareMenu>
) {
  return <ListingShareMenu {...props} />;
}
