import type { Metadata } from "next";
import { ApiPlaygroundConsole } from "@/components/developers/api-playground-console";

export const metadata: Metadata = {
  title: "Interactive API Playground | Yike Developer Platform",
  description: "Live test Yike REST endpoints for listings, escrow milestones, and trust score passports.",
};

export default function ApiPlaygroundPage() {
  return (
    <main>
      <ApiPlaygroundConsole />
    </main>
  );
}
