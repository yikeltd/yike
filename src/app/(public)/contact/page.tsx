import { SOCIAL_LINKS, SITE_NAME } from "@/lib/constants";

export default function ContactPage() {
  return (
    <div className="space-y-6 pt-4">
      <h1 className="text-2xl font-bold">Contact {SITE_NAME}</h1>
      <p className="text-sm text-muted">
        For support, partnerships, or to report platform issues, reach us on
        social media or email hello@yike.ng (configure when live).
      </p>
      <div className="card-shadow space-y-3 rounded-2xl border border-border p-4 text-sm">
        <a href={SOCIAL_LINKS.facebook} className="block text-primary">
          Facebook — facebook.com/realyike
        </a>
        <a href={SOCIAL_LINKS.x} className="block text-primary">
          X — @real_yike
        </a>
        <a href="mailto:hello@yike.ng" className="block text-primary">
          hello@yike.ng
        </a>
      </div>
    </div>
  );
}
