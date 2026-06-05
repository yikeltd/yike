"use client";

import { useState } from "react";
import { Home } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isDemoProperty } from "@/lib/mock-listings";

export function ReportRentedButton({ propertyId }: { propertyId: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function report() {
    if (done || loading) return;
    setLoading(true);

    if (isSupabaseConfigured() && !isDemoProperty(propertyId)) {
      const supabase = createClient();
      await supabase.from("listing_reports").insert({
        property_id: propertyId,
        reason: "Already rented",
        message: "Consumer flagged: home may no longer be available.",
      });
    }

    setLoading(false);
    setDone(true);
  }

  if (done) {
    return (
      <p className="text-sm font-medium text-muted">
        Thanks — we&apos;ll check if this home is still available.
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={report}
      disabled={loading}
      className="pressable flex w-full items-center justify-center gap-2 rounded-xl border border-surface bg-white px-4 py-3 text-sm font-semibold text-navy shadow-float disabled:opacity-60"
    >
      <Home className="h-4 w-4 text-muted" />
      {loading ? "Sending…" : "Already rented? Let us know"}
    </button>
  );
}
