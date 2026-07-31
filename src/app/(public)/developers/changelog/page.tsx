import type { Metadata } from "next";
import { ApiChangelogExperience } from "@/components/developers/api-changelog-experience";

export const metadata: Metadata = {
  title: "API Changelog & Release History | Yike Developer Platform",
  description: "Chronological API release history, feature additions, breaking changes, and migration notes.",
};

export default function ApiChangelogPage() {
  return (
    <main>
      <ApiChangelogExperience />
    </main>
  );
}
