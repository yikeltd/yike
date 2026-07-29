import { requireAuth } from "@/lib/auth";
import { SellerPromotionsHub } from "@/components/agent/seller-promotions-hub";

export const metadata = {
  title: "Promotions & Advertising Hub | Yike Seller Console",
  description: "Self-service advertising, featured listing promotions, and campaign metrics.",
};

export default async function SellerPromotionsPage() {
  const user = await requireAuth("/auth/login?next=/agent/promotions");
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8">
      <SellerPromotionsHub userId={user.id} />
    </div>
  );
}
