import type { Metadata } from "next";
import { SandboxConsole } from "@/components/developers/sandbox-console";

export const metadata: Metadata = {
  title: "Developer Sandbox Testing Console | Yike Developer Platform",
  description: "Isolated developer testing environment with mock data seeders, test payment faucets, and webhook event inspectors.",
};

export default function DeveloperSandboxPage() {
  return (
    <main>
      <SandboxConsole />
    </main>
  );
}
