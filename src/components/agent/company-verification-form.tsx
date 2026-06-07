"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CompanyVerificationForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/agent/company-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cac_number: form.get("cac_number"),
        cac_document_url: form.get("cac_document_url"),
        bank_name: form.get("bank_name"),
        bank_account_number: form.get("bank_account_number"),
        bank_account_name: form.get("bank_account_name"),
        applicant_name: form.get("applicant_name"),
        applicant_role: form.get("applicant_role"),
        applicant_phone: form.get("applicant_phone"),
        applicant_email: form.get("applicant_email"),
      }),
    });
    const data = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setMessage(data.error ?? "Could not submit");
      return;
    }
    setMessage("Submitted — Yike will review your company details.");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
      <p className="text-sm text-muted">
        Submit your company details for Yike verification. Bank details are private and only visible to admin.
      </p>
      <Input name="cac_number" placeholder="CAC registration number" required />
      <Input name="cac_document_url" placeholder="CAC document URL (upload link)" />
      <Input name="applicant_name" placeholder="Applicant full name" required />
      <Input name="applicant_role" placeholder="Your role (e.g. Director)" />
      <Input name="applicant_phone" placeholder="Applicant phone / WhatsApp" />
      <Input name="applicant_email" type="email" placeholder="Applicant email" />
      <Input name="bank_name" placeholder="Bank name" />
      <Input name="bank_account_name" placeholder="Account name" />
      <Input name="bank_account_number" placeholder="Account number (private)" />
      {message ? (
        <p className="rounded-lg bg-surface px-3 py-2 text-sm text-navy">{message}</p>
      ) : null}
      <Button type="submit" disabled={busy}>
        Submit for verification
      </Button>
    </form>
  );
}
