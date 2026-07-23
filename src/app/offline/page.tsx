"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { brand } from "@/lib/design/tokens";
import { OfflineRecentListings } from "@/components/pwa/offline-recent";

/**
 * Cold-start offline shell — only when navigation fails and no usable
 * document cache exists. Warm sessions should never land here (SW serves
 * cached `/` first). CTA is Try Again → home, not “Back home”.
 */
export default function OfflinePage() {
  const [busy, setBusy] = useState(false);

  const tryAgain = useCallback(() => {
    setBusy(true);
    window.location.assign("/");
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-navy/[0.04] via-background to-background px-6 py-10 text-center">
      <Image
        src={brand.logo}
        alt="Yike"
        width={72}
        height={72}
        className="rounded-2xl"
        priority
      />
      <p className="mt-5 text-2xl font-bold tracking-tight text-navy">Yike</p>
      <h1 className="mt-3 text-lg font-semibold text-foreground">
        No internet connection
      </h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
        Connect to the internet to discover homes and vehicles across Nigeria.
      </p>
      <OfflineRecentListings />
      <button
        type="button"
        onClick={tryAgain}
        disabled={busy}
        className="btn-accent mt-8 inline-flex h-11 items-center justify-center rounded-xl px-6 text-sm font-semibold disabled:opacity-70"
      >
        {busy ? "Trying…" : "Try Again"}
      </button>
    </div>
  );
}
