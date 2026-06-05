import { SITE_NAME, SITE_TAGLINE, SOCIAL_LINKS } from "@/lib/constants";

export default function AboutPage() {
  return (
    <div className="prose-sm space-y-4 pt-4">
      <h1 className="text-2xl font-bold">About {SITE_NAME}</h1>
      <p className="text-muted">{SITE_TAGLINE}</p>
      <p>
        {SITE_NAME} is a mobile-first Nigerian housing marketplace built for
        speed, trust, and simplicity. Browse real listings, contact agents on
        WhatsApp, and list properties for free.
      </p>
      <h2 className="text-lg font-semibold">Follow us</h2>
      <ul className="space-y-2 text-sm">
        <li>
          <a href={SOCIAL_LINKS.facebook} className="text-primary">
            Facebook
          </a>
        </li>
        <li>
          <a href={SOCIAL_LINKS.x} className="text-primary">
            X (Twitter)
          </a>
        </li>
        <li>
          <a href={SOCIAL_LINKS.youtube} className="text-primary">
            YouTube
          </a>
        </li>
        <li>
          <a href={SOCIAL_LINKS.tiktok} className="text-primary">
            TikTok
          </a>
        </li>
      </ul>
    </div>
  );
}
