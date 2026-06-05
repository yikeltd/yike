"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, X } from "lucide-react";
import { shouldShowPwaPrompt } from "@/lib/engagement";
import { trackEvent } from "@/lib/analytics";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "yike-pwa-install-dismissed";

export function PwaInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [visible, setVisible] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }
    if (sessionStorage.getItem(DISMISS_KEY)) return;

    const onInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setInstalled(true);
      setVisible(false);
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  useEffect(() => {
    if (!deferred || installed) return;
    if (!shouldShowPwaPrompt()) return;

    const timer = window.setTimeout(() => {
      setVisible(true);
      trackEvent("pwa_install_prompt");
    }, 8000);

    return () => window.clearTimeout(timer);
  }, [deferred, installed]);

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") {
      trackEvent("pwa_install_accept");
    }
    setDeferred(null);
    setVisible(false);
  }

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  if (installed || !visible || !deferred) return null;

  return (
    <div className="fixed inset-x-0 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-lg px-3 lg:bottom-6">
      <div className="flex items-center gap-3 rounded-2xl border border-gold/25 bg-white p-3 shadow-float-lg">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/15">
          <Download className="h-5 w-5 text-gold-dark" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-navy">Add Yike to your home screen</p>
          <p className="text-xs text-muted">Browse homes faster — works offline too</p>
        </div>
        <button
          type="button"
          onClick={install}
          className="pressable shrink-0 rounded-lg bg-gold px-3 py-2 text-xs font-bold text-navy"
        >
          Install
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="pressable shrink-0 rounded-lg p-2 text-muted"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
