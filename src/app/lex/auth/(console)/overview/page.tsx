import { requireServerClient } from "@/lib/supabase/require-client";
import Link from "next/link";

export default async function AdminOverviewPage() {
  const supabase = await requireServerClient();

  const [pending, reports, agents] = await Promise.all([
    supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("listing_reports")
      .select("*", { count: "exact", head: true })
      .eq("status", "open"),
    supabase
      .from("agent_verifications")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/lex/auth/listings"
          className="rounded-xl border border-border bg-white p-4"
        >
          <p className="text-3xl font-bold">{pending.count ?? 0}</p>
          <p className="text-sm text-muted">Pending listings</p>
        </Link>
        <Link
          href="/lex/auth/reports"
          className="rounded-xl border border-border bg-white p-4"
        >
          <p className="text-3xl font-bold">{reports.count ?? 0}</p>
          <p className="text-sm text-muted">Open reports</p>
        </Link>
        <Link
          href="/lex/auth/agents"
          className="rounded-xl border border-border bg-white p-4"
        >
          <p className="text-3xl font-bold">{agents.count ?? 0}</p>
          <p className="text-sm text-muted">Agent verifications</p>
        </Link>
      </div>
    </div>
  );
}
