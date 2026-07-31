import type { Metadata } from "next";
import { ApiVersioningDashboard } from "@/components/developers/api-versioning-dashboard";

export const metadata: Metadata = {
  title: "API Version Manager & Lifecycle Governance | Yike Developer Platform",
  description: "API release lifecycles (v1.0 Active, v2.0 Beta Preview), deprecation policies (Sunset-Date headers), and SDK compatibility matrix.",
};

export default function DeveloperApiVersioningPage() {
  return (
    <main>
      <ApiVersioningDashboard />
    </main>
  );
}
