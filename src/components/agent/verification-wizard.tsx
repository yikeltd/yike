"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NIGERIAN_STATES } from "@/lib/constants";
import {
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  User,
} from "lucide-react";
import Link from "next/link";
import { friendlyPublicError, PUBLIC_ERROR_FALLBACK } from "@/lib/copy/public-errors";
import { cn } from "@/lib/utils";
import { yikeVerificationWhatsAppLink } from "@/lib/agent-verification";
import { WHATSAPP_VERIFY_COPY } from "@/lib/whatsapp-verification/copy";
import { VerificationOptionCard } from "@/components/verification/verification-option-card";
import type { AgentVerification, Profile } from "@/types/database";

const STEPS = [
  { id: 1, title: "Personal", icon: User },
  { id: 2, title: "NIN", icon: CheckCircle2 },
  { id: 3, title: "Selfie", icon: Camera },
  { id: 4, title: "Review", icon: CheckCircle2 },
] as const;

type FormState = {
  fullName: string;
  residentialAddress: string;
  state: string;
  city: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  occupation: string;
  nin: string;
  selfieUrl: string;
};

export function VerificationWizard({
  profile,
  verification,
  onSubmitted,
}: {
  profile: Profile;
  verification: AgentVerification | null;
  onSubmitted: () => void;
}) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormState>({
    fullName: profile.full_name ?? "",
    residentialAddress: "",
    state: "",
    city: "",
    dateOfBirth: "",
    phone: profile.phone ?? "",
    email: profile.email ?? "",
    occupation: "",
    nin: "",
    selfieUrl: "",
  });

  const set = useCallback(
    (key: keyof FormState, value: string) =>
      setForm((f) => ({ ...f, [key]: value })),
    []
  );

  async function uploadSelfie(file: File) {
    setUploading(true);
    setMessage("");
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/agent/verification/selfie", {
      method: "POST",
      body,
    });
    const data = await res.json().catch(() => ({}));
    setUploading(false);
    if (!res.ok) {
      setMessage(friendlyPublicError(data.error as string, "Upload failed. Try again."));
      return;
    }
    set("selfieUrl", data.url);
    setPreview(URL.createObjectURL(file));
  }

  async function submit() {
    setSubmitting(true);
    setMessage("");
    const res = await fetch("/api/agent/verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: form.fullName,
        residentialAddress: form.residentialAddress,
        state: form.state,
        city: form.city,
        dateOfBirth: form.dateOfBirth,
        phone: form.phone,
        email: form.email,
        occupation: form.occupation,
        nin: form.nin,
        selfieUrl: form.selfieUrl,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) {
      setMessage(friendlyPublicError(data.error as string, PUBLIC_ERROR_FALLBACK));
      return;
    }
    setMessage(data.message ?? "Submitted!");
    onSubmitted();
  }

  const isVerified =
    verification?.status === "approved" ||
    profile.verification_status === "approved" ||
    profile.verified_badge ||
    profile.role === "agent_verified";

  if (isVerified) {
    return (
      <VerificationOptionCard
        title={WHATSAPP_VERIFY_COPY.agentBadgeTitle}
        status={WHATSAPP_VERIFY_COPY.agentBadgeVerified}
        statusVariant="success"
        disabled
      />
    );
  }

  if (
    verification?.status === "pending" ||
    profile.verification_status === "pending"
  ) {
    return (
      <div className="space-y-2">
        <VerificationOptionCard
          title={WHATSAPP_VERIFY_COPY.agentBadgeTitle}
          status={WHATSAPP_VERIFY_COPY.agentBadgeUnderReview}
          statusVariant="pending"
          actionLabel={showDetails ? undefined : "View options"}
          onAction={showDetails ? undefined : () => setShowDetails(true)}
          disabled={showDetails}
        />
        {showDetails ? (
          <div className="space-y-2 rounded-2xl border border-border bg-elevated px-4 py-3 text-xs text-muted">
            <p>Review usually takes 1–2 business days.</p>
            <p>We&apos;ll reach you on WhatsApp if we need anything.</p>
            <Link
              href={yikeVerificationWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex font-semibold text-navy"
            >
              Contact support →
            </Link>
            <button
              type="button"
              onClick={() => setShowDetails(false)}
              className="block text-xs font-semibold text-muted"
            >
              Close
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  const rejected =
    verification?.status === "rejected" ||
    profile.verification_status === "rejected";

  if (!expanded) {
    return (
      <VerificationOptionCard
        title={WHATSAPP_VERIFY_COPY.agentBadgeTitle}
        status={WHATSAPP_VERIFY_COPY.agentBadgeOptional}
        statusVariant="neutral"
        actionLabel="View options"
        onAction={() => setExpanded(true)}
      />
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-elevated shadow-float">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-navy">
            {WHATSAPP_VERIFY_COPY.agentBadgeTitle}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {WHATSAPP_VERIFY_COPY.agentBadgeDescription}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="shrink-0 text-xs font-semibold text-muted hover:text-navy"
        >
          Close
        </button>
      </div>

      {rejected && (
        <div className="mx-4 rounded-xl border border-danger/20 bg-danger/5 px-3 py-2 text-xs text-danger">
          <strong>Application rejected.</strong>{" "}
          {verification?.rejection_reason ?? "Please correct your details and resubmit."}
        </div>
      )}

      <div className="space-y-6 px-4 pb-4">

      <div className="flex items-center justify-between gap-1">
        {STEPS.map((s) => (
          <div key={s.id} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-colors",
                step >= s.id ? "bg-gold text-navy" : "bg-surface text-muted"
              )}
            >
              {s.id}
            </div>
            <span className="text-[10px] font-bold uppercase text-muted">{s.title}</span>
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-3 animate-in fade-in duration-200">
          <Input
            placeholder="Full legal name"
            value={form.fullName}
            onChange={(e) => set("fullName", e.target.value)}
            required
          />
          <Input
            placeholder="Residential address"
            value={form.residentialAddress}
            onChange={(e) => set("residentialAddress", e.target.value)}
            required
          />
          <select
            value={form.state}
            onChange={(e) => set("state", e.target.value)}
            className="h-12 w-full rounded-xl bg-surface px-4 text-sm"
          >
            <option value="">State</option>
            {NIGERIAN_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <Input
            placeholder="City"
            value={form.city}
            onChange={(e) => set("city", e.target.value)}
          />
          <Input
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => set("dateOfBirth", e.target.value)}
          />
          <Input
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            inputMode="tel"
          />
          <Input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />
          <Input
            placeholder="Occupation (optional)"
            value={form.occupation}
            onChange={(e) => set("occupation", e.target.value)}
          />
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3 animate-in fade-in duration-200">
          <p className="text-sm text-muted">
            Enter your 11-digit NIN. Name must match your legal name above.
          </p>
          <Input
            placeholder="NIN (11 digits)"
            value={form.nin}
            onChange={(e) => set("nin", e.target.value.replace(/\D/g, "").slice(0, 11))}
            inputMode="numeric"
            maxLength={11}
          />
          <p className="text-xs text-muted">
            Name on your NIN should match: <strong>{form.fullName || "—"}</strong>
          </p>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <p className="text-sm text-muted">
            Take a clear selfie in good light. Face the camera directly — no hats or sunglasses.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="user"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void uploadSelfie(f);
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="pressable flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-gold/40 bg-surface py-10"
          >
            {preview || form.selfieUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview ?? form.selfieUrl}
                alt="Selfie preview"
                className="h-32 w-32 rounded-full object-cover ring-4 ring-gold/30"
              />
            ) : (
              <Camera className="h-12 w-12 text-gold" />
            )}
            <span className="text-sm font-bold text-navy">
              {uploading ? "Uploading…" : form.selfieUrl ? "Retake selfie" : "Capture selfie"}
            </span>
          </button>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-3 rounded-2xl bg-elevated p-4 text-sm animate-in fade-in duration-200">
          <p>
            <span className="text-muted">Name:</span> {form.fullName}
          </p>
          <p>
            <span className="text-muted">Address:</span> {form.residentialAddress}
          </p>
          <p>
            <span className="text-muted">Location:</span> {form.city}, {form.state}
          </p>
          <p>
            <span className="text-muted">DOB:</span> {form.dateOfBirth}
          </p>
          <p>
            <span className="text-muted">NIN:</span> •••••{form.nin.slice(-4)}
          </p>
          <p>
            <span className="text-muted">Selfie:</span>{" "}
            {form.selfieUrl ? "Uploaded ✓" : "Missing"}
          </p>
        </div>
      )}

      {message && (
        <p className={cn("text-sm", message.includes("Submitted") ? "text-gold-dark" : "text-danger")}>
          {message}
        </p>
      )}

      <div className="flex gap-3 pb-0">
        {step > 1 && (
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => setStep((s) => s - 1)}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
        )}
        {step < 4 ? (
          <Button
            type="button"
            className="flex-1"
            onClick={() => setStep((s) => s + 1)}
            disabled={
              (step === 1 &&
                (!form.fullName ||
                  !form.residentialAddress ||
                  !form.state ||
                  !form.city ||
                  !form.dateOfBirth)) ||
              (step === 2 && form.nin.length !== 11) ||
              (step === 3 && !form.selfieUrl)
            }
          >
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            className="flex-1"
            disabled={submitting}
            onClick={() => void submit()}
          >
            {submitting ? "Submitting…" : "Submit for review"}
          </Button>
        )}
      </div>
      </div>
    </div>
  );
}
