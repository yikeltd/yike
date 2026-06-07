"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function ResolveReportButton({ reportId }: { reportId: string }) {
  const router = useRouter();

  async function updateStatus(
    status: "action_taken" | "dismissed" | "reviewed"
  ) {
    const supabase = createClient();
    await supabase
      .from("listing_reports")
      .update({
        status,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", reportId);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" onClick={() => updateStatus("action_taken")}>
        Action taken
      </Button>
      <Button size="sm" variant="ghost" onClick={() => updateStatus("dismissed")}>
        Dismiss
      </Button>
      <Button size="sm" variant="ghost" onClick={() => updateStatus("reviewed")}>
        Mark reviewed
      </Button>
    </div>
  );
}
