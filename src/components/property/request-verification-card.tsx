"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { RESUME_VERIFICATION_KEY } from "@/lib/resume-auth-intent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { LEGAL_DISCLAIMER } from "@/lib/verifier/constants";

type Props = {
  listingId: string;
  listingTitle: string;
  loginNext?: string;
  defaultWhatsapp?: string | null;
  className?: string;
};

export function RequestVerificationCard({
  listingId,
  listingTitle,
  loginNext = "/",
  defaultWhatsapp,
  className,
}: Props) {
  const router = useRouter();
  const { user, guardAction } = useAuth();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [whatsapp, setWhatsapp] = useState(defaultWhatsapp ?? "");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    try {
      const resumeId = sessionStorage.getItem(RESUME_VERIFICATION_KEY);
      if (resumeId === listingId) {
        sessionStorage.removeItem(RESUME_VERIFICATION_KEY);
        setOpen(true);
      }
    } catch {
      /* ignore */
    }
  }, [user, listingId]);

  if (success) {
    return (
      <section
        className={cn(
          "rounded-2xl border border-gold/30 bg-gold/5 p-4 lg:p-5",
          className
        )}
      >
        <p className="text-sm font-semibold text-navy">{success}</p>
      </section>
    );
  }

  function requestSignIn() {
    guardAction(
      {
        type: "verification_request",
        listingId,
        redirectPath: loginNext,
        sourceSurface: "listing_detail",
      },
      () => setOpen(true)
    );
  }

  if (!user) {
    return (
      <section
        className={cn(
          "rounded-2xl border border-border bg-white p-4 shadow-float lg:p-5",
          className
        )}
      >
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
          <div>
            <h2 className="text-sm font-bold text-navy lg:text-base">
              Request Yike verification
            </h2>
            <p className="mt-1 text-sm text-muted">
              Request an independent physical inspection before you travel or pay.
            </p>
            <p className="mt-2 text-xs text-muted">{LEGAL_DISCLAIMER}</p>
            <Button
              type="button"
              className="mt-3 bg-navy text-gold hover:bg-navy/90"
              onClick={requestSignIn}
            >
              Sign in to continue
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-white p-4 shadow-float lg:p-5",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-navy lg:text-base">
            Request Yike verification
          </h2>
          <p className="mt-1 text-sm text-muted">
            Request an independent physical inspection before you travel or pay.
          </p>
          <p className="mt-2 text-xs text-muted">{LEGAL_DISCLAIMER}</p>

          {!open ? (
            <Button
              type="button"
              variant="secondary"
              className="mt-3 bg-navy text-gold hover:bg-navy/90"
              onClick={() => setOpen(true)}
            >
              Request verification
            </Button>
          ) : (
            <form
              className="mt-4 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                void submit();
              }}
            >
              <p className="text-xs text-muted">For: {listingTitle}</p>
              <Input
                placeholder="WhatsApp (optional)"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                autoComplete="tel"
              />
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Anything you want us to check? (optional)"
                rows={3}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm"
                maxLength={2000}
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={busy}>
                  {busy ? "Sending…" : "Submit request"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                  disabled={busy}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );

  async function submit() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/inspection-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingId,
        userNote: note,
        requesterWhatsapp: whatsapp,
      }),
    });
    const data = (await res.json()) as { message?: string; error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not submit. Try again.");
      return;
    }
    setSuccess(
      data.message ??
        "Verification request received. Yike support will contact you with next steps."
    );
    router.refresh();
  }
}
