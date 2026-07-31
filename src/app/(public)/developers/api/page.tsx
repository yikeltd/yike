import type { Metadata } from "next";
import { ApiVersionCenterExperience } from "@/components/developers/api-version-center-experience";

export const metadata: Metadata = {
  title: "API Version Center & Lifecycle Management | Yike Developer Platform",
  description: "Formal API release timelines, deprecation notices, sunset windows, and SDK compatibility matrices.",
};

export default function ApiVersionCenterPage() {
  return (
    <main>
      <ApiVersionCenterExperience />
    </main>
  );
}
