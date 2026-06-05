"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function ResolveReportButton({ reportId }: { reportId: string }) {
  const router = useRouter();

  async function resolve() {
    const supabase = createClient();
    await supabase
      .from("listing_reports")
      .update({ status: "resolved" })
      .eq("id", reportId);
    router.refresh();
  }

  return (
    <Button size="sm" variant="outline" onClick={resolve}>
      Mark resolved
    </Button>
  );
}
