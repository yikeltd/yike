import { requireTechConsole } from "@/lib/auth";
import { AdminPageHeader } from "@/components/admin/dashboard/admin-ui";
import { EnvHealthPanel } from "@/components/admin/env-health-panel";

export default async function TechEnvHealthPage() {
  await requireTechConsole();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Environment health"
        description="Required production variables — values are never shown."
      />
      <EnvHealthPanel />
    </div>
  );
}
