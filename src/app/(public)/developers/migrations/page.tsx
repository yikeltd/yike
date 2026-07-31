import type { Metadata } from "next";
import { ApiMigrationGuidesExperience } from "@/components/developers/api-migration-guides-experience";

export const metadata: Metadata = {
  title: "API Migration Guides | Yike Developer Platform",
  description: "Step-by-step documentation for migrating between API major versions with side-by-side code diffs.",
};

export default function ApiMigrationGuidesPage() {
  return (
    <main>
      <ApiMigrationGuidesExperience />
    </main>
  );
}
