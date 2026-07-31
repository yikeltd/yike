import type { Metadata } from "next";
import { OAuthConsentServer } from "@/components/developers/oauth-consent-server";

export const metadata: Metadata = {
  title: "Authorize OAuth Application Access | Yike Platform",
  description: "Merchant authorization consent screen for approving third-party application access requests.",
};

export default function OAuthAuthorizePage() {
  return (
    <main>
      <OAuthConsentServer />
    </main>
  );
}
