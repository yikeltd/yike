"use client";

import { useState } from "react";
import { REPORT_REASONS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import {
  HumanVerifyField,
  readHumanVerifyFromForm,
} from "@/components/forms/human-verify-field";

export function ReportListingForm({ propertyId }: { propertyId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [verifyOk, setVerifyOk] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const check = readHumanVerifyFromForm(form);
    if (!check.ok) {
      setError(check.error ?? "Please solve the math check.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    await supabase.from("listing_reports").insert({
      property_id: propertyId,
      reporter_name: form.get("name") as string,
      reporter_phone: form.get("phone") as string,
      reason: form.get("reason") as string,
      message: (form.get("message") as string) || null,
    });
    setLoading(false);
    setDone(true);
  }

  if (done) {
    return (
      <p className="text-sm text-primary">
        Thanks — we&apos;ll review this report shortly.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-danger underline-offset-2 hover:underline"
      >
        Report this listing
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-border p-4">
      <p className="font-medium text-sm">Report listing</p>
      <Input name="name" placeholder="Your name (optional)" />
      <Input name="phone" placeholder="Your phone (optional)" />
      <Select name="reason" required defaultValue="">
        <option value="" disabled>
          Select reason
        </option>
        {REPORT_REASONS.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </Select>
      <Textarea name="message" placeholder="More details (optional)" rows={3} />
      <HumanVerifyField onValidChange={setVerifyOk} />
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={loading || !verifyOk} size="sm">
          {loading ? "Sending…" : "Submit report"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setOpen(false)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
