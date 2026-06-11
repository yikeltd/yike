import Link from "next/link";
import { requireAuth, getProfile } from "@/lib/auth";
import { canListProperties } from "@/lib/agent-tiers";
import { SellerLeadsDashboard } from "@/components/agent/seller-leads-dashboard";

export default async function AgentLeadsPage() {
  const user = await requireAuth("/auth/login?next=/agent/leads");
  const profile = await getProfile(user.id);

  if (!profile || !canListProperties(profile)) {
    return (
      <div className="space-y-4 pt-4">
        <p className="text-muted">Become an agent to view leads.</p>
        <Link href="/agent/become" className="font-semibold text-gold-dark">
          Become an agent →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-4">
      <div>
        <Link href="/agent" className="text-sm font-semibold text-gold-dark">
          ← Seller dashboard
        </Link>
        <h1 className="mt-2 text-xl font-bold text-navy">Leads</h1>
        <p className="text-sm text-muted">
          Real interactions from renters — WhatsApp, calls, saves, and follows. No recycled leads.
        </p>
      </div>
      <SellerLeadsDashboard />
    </div>
  );
}
