import type { Metadata } from "next";
import { OAuthScopesReference } from "@/components/developers/oauth-scopes-reference";

export const metadata: Metadata = {
  title: "OAuth 2.0 Fine-Grained Permission Scopes Registry | Yike Developer Platform",
  description: "Granular RBAC permission scopes for third-party application authorization and access control.",
};

export default function DeveloperScopesPage() {
  return (
    <main>
      <OAuthScopesReference />
    </main>
  );
}
