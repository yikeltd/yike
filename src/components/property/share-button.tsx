"use client";

import { Share2 } from "lucide-react";

export function ShareButton({
  title,
  text,
  url,
}: {
  title: string;
  text: string;
  url: string;
}) {
  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        /* cancelled */
      }
    }
    await navigator.clipboard.writeText(url);
  }

  return (
    <button
      type="button"
      onClick={share}
      className="pressable flex h-10 w-10 items-center justify-center rounded-full bg-elevated/90 shadow-float backdrop-blur-sm"
      aria-label="Share listing"
    >
      <Share2 className="h-4 w-4 text-navy" />
    </button>
  );
}
