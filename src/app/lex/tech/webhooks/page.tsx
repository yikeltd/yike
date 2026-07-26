import { AdminPageHeader } from "@/components/admin/dashboard/admin-ui";
import { SafeHavenHealthPanel } from "@/components/admin/safehaven-health-panel";

export default function TechWebhooksPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Webhook health"
        description="Provider webhook endpoints and Safe Haven preparation status"
      />
      <SafeHavenHealthPanel />
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-900">
        <p className="font-semibold">Paystack</p>
        <p className="mt-1">
          Preferred: <code className="text-xs">https://yike.ng/api/payments/webhook</code>
        </p>
        <p className="mt-1">
          Legacy alias: <code className="text-xs">https://yike.ng/api/webhooks/paystack</code>
        </p>
        <p className="mt-2">
          Transaction + webhook audit:{" "}
          <a className="underline" href="/lex/auth/revenue/transactions">
            Revenue → Transactions
          </a>
        </p>
      </div>
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-900">
        Sendchamp and other webhooks: check audit logs for delivery issues.
      </div>
    </div>
  );
}
