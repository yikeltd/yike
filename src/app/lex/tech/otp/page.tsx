import { requireServerClient } from "@/lib/supabase/require-client";
import { AdminPageHeader } from "@/components/admin/dashboard/admin-ui";

export default async function OtpFailuresPage() {
  const supabase = await requireServerClient();
  const { data } = await supabase
    .from("otp_logs")
    .select("*")
    .eq("status", "failed")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="OTP failures" description="Sendchamp delivery issues" />
      <div className="overflow-x-auto rounded-2xl border border-navy/10 bg-white shadow-sm">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b bg-surface/80">
              <th className="px-4 py-3 text-xs font-bold uppercase text-muted">Phone</th>
              <th className="px-4 py-3 text-xs font-bold uppercase text-muted">Status</th>
              <th className="px-4 py-3 text-xs font-bold uppercase text-muted">Provider</th>
              <th className="px-4 py-3 text-xs font-bold uppercase text-muted">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {(data ?? []).map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3 font-mono text-xs">{row.phone}</td>
                <td className="px-4 py-3 text-xs">{row.status}</td>
                <td className="px-4 py-3 text-xs text-muted">{row.provider}</td>
                <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                  {new Date(row.created_at).toLocaleString("en-NG")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
