"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import {
  dismissPwaPrompt,
  isPwaInstalled,
  notifyPwaEligibilityCheck,
  PWA_CHECK_EVENT,
  shouldShowPwaInstallPrompt,
} from "@/lib/pwa/engagement";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  const evaluate = useCallback(() => {
    if (!deferred || isPwaInstalled()) return;
    if (shouldShowPwaInstallPrompt()) {
      setVisible(true);
      trackEvent("pwa_install_prompt");
    }
  }, [deferred]);

  useEffect(() => {
    if (typeof window === "undefined" || isPwaInstalled()) return;

    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener(PWA_CHECK_EVENT, evaluate);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener(PWA_CHECK_EVENT, evaluate);
    };
  }, [evaluate]);

  useEffect(() => {
    evaluate();
  }, [evaluate]);

  if (!visible || !deferred) return null;

  function close() {
    dismissPwaPrompt();
    setVisible(false);
    trackEvent("pwa_install_dismiss");
  }

  async function install() {
    await deferred!.prompt();
    const choice = await deferred!.userChoice;
    if (choice.outcome === "accepted") {
      trackEvent("pwa_install_accept");
    }
    dismissPwaPrompt();
    setVisible(false);
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-navy/40 backdrop-blur-[2px]"
        aria-hidden
        onClick={close}
      />
      <div
        role="dialog"
        aria-labelledby="pwa-install-title"
        className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border-t border-gold/20 bg-white px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-5 shadow-float-lg"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-surface" />
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold/15">
            <Download className="h-5 w-5 text-gold-dark" />
          </div>
          <div className="min-w-0 flex-1">
            <p id="pwa-install-title" className="text-base font-bold text-navy">
              Add Yike to Home Screen
            </p>
            <p className="mt-1 text-sm leading-snug text-muted">
              Swipe homes faster and get property alerts instantly.
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            className="pressable rounded-full p-1.5 text-muted"
            aria-label="Not now"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={close}
            className="pressable flex-1 rounded-xl border border-border py-3 text-sm font-semibold text-navy"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={() => void install()}
            className="pressable flex-1 rounded-xl bg-gold py-3 text-sm font-bold text-navy shadow-glow-gold"
          >
            Install
          </button>
        </div>
      </div>
    </>
  );
}

// Re-export for callers that trigger eligibility after engagement
export { notifyPwaEligibilityCheck };
