"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, Upload } from "lucide-react";
import type { Profile, SellerVerification } from "@/types/database";
import {
  BUSINESS_VERIFICATION_FEE_NGN,
  SELLER_VERIFICATION_COPY,
} from "@/lib/seller-verification/constants";
import {
  getSellerTrustLevel,
  isBusinessSellerType,
  type SellerVerificationDocuments,
} from "@/lib/seller-verification/levels";
import { formatPrice } from "@/lib/utils";
import { SellerTrustBadge } from "@/components/seller/seller-trust-badge";
import { cn } from "@/lib/utils";

type StatusResponse = {
  trustLevel: ReturnType<typeof getSellerTrustLevel>;
  verification: SellerVerification | null;
};

export function BusinessVerificationCard({ profile }: { profile: Profile }) {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const businessType = isBusinessSellerType(profile);
  const [rcBn, setRcBn] = useState(profile.cac_number ?? "");
  const [contactPhone, setContactPhone] = useState(profile.phone ?? profile.whatsapp ?? "");
  const [idPath, setIdPath] = useState("");
  const [cacPath, setCacPath] = useState(profile.cac_document_path ?? "");
  const [selfiePath, setSelfiePath] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/agent/seller-verification/status");
    const data = (await res.json()) as StatusResponse & { error?: string };
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not load status");
      return;
    }
    setStatus(data);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function uploadFile(file: File, kind: "id" | "cac" | "selfie") {
    const form = new FormData();
    form.set("file", file);
    form.set("kind", kind);
    const res = await fetch("/api/agent/seller-verification/document", {
      method: "POST",
      body: form,
    });
    const data = (await res.json()) as { path?: string; error?: string };
    if (!res.ok) throw new Error(data.error ?? "Upload failed");
    return data.path ?? "";
  }

  async function handleSubmit() {
    setBusy(true);
    setError(null);
    try {
      const documents: SellerVerificationDocuments = businessType
        ? {
            seller_type: "business",
            cac_certificate_path: cacPath,
            rc_bn_number: rcBn.trim(),
            contact_phone: contactPhone.trim(),
          }
        : {
            seller_type: "agent",
            id_document_path: idPath,
            selfie_path: selfiePath || undefined,
          };

      const res = await fetch("/api/agent/seller-verification/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documents }),
      });
      const data = (await res.json()) as {
        authorizationUrl?: string;
        error?: string;
        paymentsLive?: boolean;
      };
      if (!res.ok) {
        setError(data.error ?? "Could not submit application");
        return;
      }
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
        return;
      }
      setOpen(false);
      void reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const trustLevel = status?.trustLevel ?? getSellerTrustLevel(profile);
  const verification = status?.verification;

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-white p-4 text-sm text-muted">
        Loading verification status…
      </div>
    );
  }

  if (trustLevel === "business") {
    return (
      <div className="rounded-2xl border border-gold/30 bg-gold/5 p-4">
        <div className="flex items-center gap-2">
          <SellerTrustBadge level="business" size="md" />
        </div>
        <p className="mt-2 text-sm text-muted">
          Your business profile has been reviewed by Yike.
        </p>
      </div>
    );
  }

  const pending = verification && ["pending", "under_review"].includes(verification.status);
  const rejected = verification?.status === "rejected";
  const needsInfo =
    rejected &&
    verification.review_notes?.toLowerCase().includes("additional information");

  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy/5">
          <ShieldCheck className="h-5 w-5 text-navy" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-navy">Business Verified</h2>
          <p className="mt-1 text-sm text-muted">
            Stand out with a reviewed business badge. Yike reviews your documents — not legal
            ownership.
          </p>
          {trustLevel === "basic" ? (
            <p className="mt-2 text-xs text-emerald-700">
              You have Basic Verified ({SELLER_VERIFICATION_COPY.verifiedLabel}).
            </p>
          ) : (
            <p className="mt-2 text-xs text-amber-800">
              Complete email, WhatsApp, and profile setup for Basic Verified first.
              <Link href="/agent/profile-setup" className="ml-1 font-semibold text-navy">
                Complete profile →
              </Link>
            </p>
          )}
        </div>
      </div>

      {pending ? (
        <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Your application is{" "}
          {verification.status === "under_review" ? "under review" : "pending review"}.
        </p>
      ) : null}

      {rejected ? (
        <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-900">
          {needsInfo ? "Additional information required." : "Verification not approved."}
          {verification.review_notes ? (
            <span className="mt-1 block text-xs">{verification.review_notes}</span>
          ) : null}
        </p>
      ) : null}

      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}

      {!pending && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-4 w-full rounded-xl bg-gold py-3 text-sm font-bold text-navy pressable"
        >
          {SELLER_VERIFICATION_COPY.businessCta}
        </button>
      )}

      {open ? (
        <div className="mt-4 space-y-3 border-t border-border pt-4">
          <p className="text-xs text-muted">
            {SELLER_VERIFICATION_COPY.businessFeeLabel} ·{" "}
            {formatPrice(BUSINESS_VERIFICATION_FEE_NGN, "total", "rent")}
          </p>

          {businessType ? (
            <>
              <label className="block text-sm font-medium text-navy">
                RC / BN number
                <input
                  value={rcBn}
                  onChange={(e) => setRcBn(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                  placeholder="RC or BN number"
                />
              </label>
              <label className="block text-sm font-medium text-navy">
                Contact phone
                <input
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                  placeholder="080…"
                />
              </label>
              <UploadField
                label="CAC certificate"
                onFile={async (f) => setCacPath(await uploadFile(f, "cac"))}
                done={Boolean(cacPath)}
              />
            </>
          ) : (
            <>
              <UploadField
                label="Government ID"
                onFile={async (f) => setIdPath(await uploadFile(f, "id"))}
                done={Boolean(idPath)}
              />
              <UploadField
                label="Selfie (optional)"
                optional
                onFile={async (f) => setSelfiePath(await uploadFile(f, "selfie"))}
                done={Boolean(selfiePath)}
              />
            </>
          )}

          <button
            type="button"
            disabled={busy}
            onClick={() => void handleSubmit()}
            className={cn(
              "w-full rounded-xl bg-navy py-3 text-sm font-semibold text-white pressable",
              busy && "opacity-60"
            )}
          >
            {busy ? "Processing…" : "Pay & submit for review"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function UploadField({
  label,
  onFile,
  done,
  optional,
}: {
  label: string;
  onFile: (file: File) => Promise<void>;
  done?: boolean;
  optional?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-2 rounded-xl border border-dashed border-border px-3 py-3 text-sm pressable">
      <span className="font-medium text-navy">
        {label}
        {optional ? <span className="text-muted"> (optional)</span> : null}
      </span>
      <span className="flex items-center gap-1 text-xs font-semibold text-gold-dark">
        <Upload className="h-3.5 w-3.5" />
        {done ? "Uploaded" : "Upload"}
      </span>
      <input
        type="file"
        accept="application/pdf,image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void onFile(file);
        }}
      />
    </label>
  );
}
