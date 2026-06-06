"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

const DISMISS_KEY = "yike_pwa_dismissed";
const VISIT_KEY = "yike_pwa_visits";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (localStorage.getItem(DISMISS_KEY)) return;

    const visits = Number(localStorage.getItem(VISIT_KEY) ?? "0") + 1;
    localStorage.setItem(VISIT_KEY, String(visits));

    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      if (visits >= 2) {
        setVisible(true);
        trackEvent("pwa_install_prompt");
      }
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  if (!visible || !deferred) return null;

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  }

  async function install() {
    await deferred!.prompt();
    const choice = await deferred!.userChoice;
    if (choice.outcome === "accepted") {
      trackEvent("pwa_install_accept");
    }
    dismiss();
  }

  return (
    <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 px-3 lg:bottom-6 lg:left-auto lg:right-6 lg:max-w-sm lg:px-0">
      <div className="flex items-start gap-3 rounded-2xl border border-gold/30 bg-white p-4 shadow-float-lg">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/15">
          <Download className="h-5 w-5 text-gold-dark" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-navy">Install Yike</p>
          <p className="mt-0.5 text-xs text-muted">
            Faster browsing, swipe homes, and one-tap WhatsApp — works like an app.
          </p>
          <button
            type="button"
            onClick={() => void install()}
            className="pressable mt-3 rounded-lg bg-gold px-4 py-2 text-xs font-bold text-navy"
          >
            Install Yike
          </button>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="pressable rounded-full p-1 text-muted"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
