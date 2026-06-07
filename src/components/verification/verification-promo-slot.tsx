import { getActiveBannerForPlacement } from "@/lib/site-banners";
import type { SiteBannerPlacement } from "@/constants/siteBanners";
import {
  VerificationPromoBanner,
  type VerificationPromoVariant,
} from "@/components/verification/verification-promo-banner";

type Props = {
  placement: SiteBannerPlacement;
  variant?: VerificationPromoVariant;
  className?: string;
};

export async function VerificationPromoSlot({
  placement,
  variant = "inline",
  className,
}: Props) {
  const banner = await getActiveBannerForPlacement(placement);
  if (!banner) return null;

  return (
    <VerificationPromoBanner banner={banner} variant={variant} className={className} />
  );
}
