import type { Metadata } from "next";
import { DeveloperCredentialsManager } from "@/components/account/developer-credentials-manager";

export const metadata: Metadata = {
  title: "Developer Credentials & Webhooks | Yike Account",
  description: "Generate secret bearer API keys and register real-time webhook endpoints for marketplace events.",
};

export default function DeveloperCredentialsPage() {
  return (
    <main>
      <DeveloperCredentialsManager />
    </main>
  );
}
