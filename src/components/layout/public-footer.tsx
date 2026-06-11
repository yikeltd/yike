import { AdSlot } from "@/components/ads/ad-slot";
import { SiteFooter } from "./site-footer";

export async function PublicFooter() {
  return (
    <div className="site-footer-shell mt-auto">
      <div aria-hidden className="site-footer-blend" />
      <AdSlot placement="footer_strip" className="pt-2" />
      <SiteFooter />
    </div>
  );
}
