import { getActiveBannerForPlacement } from "@/lib/site-banners";
import type { SiteBannerPlacement } from "@/constants/siteBanners";
import { AdminPromoBanner, type AdminPromoVariant } from "@/components/promo/admin-promo-banner";

export type { AdminPromoVariant };

type Props = {
  placement: SiteBannerPlacement;
  variant?: AdminPromoVariant;
  className?: string;
};

/** Admin-controlled promo — renders nothing unless an active banner exists for placement. */
export async function AdminPromoSlot({
  placement,
  variant = "inline",
  className,
}: Props) {
  const banner = await getActiveBannerForPlacement(placement);
  if (!banner) return null;

  return <AdminPromoBanner banner={banner} variant={variant} className={className} />;
}
