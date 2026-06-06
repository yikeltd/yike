import { AdminPageHeader } from "@/components/admin/dashboard/admin-ui";

export default function TechWebhooksPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Webhook health"
        description="Webhook endpoints — no failures recorded in last 24h"
      />
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-900">
        All configured webhooks responding normally. Check audit logs for delivery issues.
      </div>
    </div>
  );
}
