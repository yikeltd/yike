import { requireAuth } from "@/lib/auth";
import { SellerPlansView } from "@/components/subscriptions/seller-plans-view";

export const metadata = {
  title: "Seller Plans | Yike",
  description: "Simple, transparent seller plans for vehicle dealers, property agents, and enterprise listers.",
};

export default async function AgentPlansPage() {
  await requireAuth("/auth/login?next=/agent/plans");

  return <SellerPlansView />;
}
