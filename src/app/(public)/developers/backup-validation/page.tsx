import type { Metadata } from "next";
import { BackupValidationDashboard } from "@/components/developers/backup-validation-dashboard";

export const metadata: Metadata = {
  title: "Backup Restore Validation & Data Integrity Console | Yike Developer Platform",
  description: "Actual restore verification, checksum matching (100%), zero data corruption audit, and encrypted snapshot history.",
};

export default function DeveloperBackupValidationPage() {
  return (
    <main>
      <BackupValidationDashboard />
    </main>
  );
}
