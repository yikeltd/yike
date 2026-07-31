import type { Metadata } from "next";
import { OAuthCredentialsManager } from "@/components/account/oauth-credentials-manager";

export const metadata: Metadata = {
  title: "OAuth 2.0 Application Manager | Yike Account",
  description: "Register third-party integration apps, issue client_id and client_secret credentials, and configure redirect URIs.",
};

export default function OAuthCredentialsPage() {
  return (
    <main>
      <OAuthCredentialsManager />
    </main>
  );
}
