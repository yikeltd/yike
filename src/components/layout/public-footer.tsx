import { AdSlot } from "@/components/ads/ad-slot";
import { SiteFooter } from "./site-footer";

export async function PublicFooter() {
  return (
    <div className="mt-auto border-t border-surface bg-elevated">
      <AdSlot placement="footer_strip" className="pt-6" />
      <SiteFooter />
    </div>
  );
}
