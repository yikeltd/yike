import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getOperationalMetrics, listCases } from "@/lib/cases/service";
import { OfficerCasesInboxClient } from "./inbox-client";

export const metadata = {
  title: "Trust Operations & Case Management | Yike Lex Admin",
  description: "Internal staff workspace for managing field inspections, legal title searches, buyer assistance, and verification cases.",
};

export default async function OfficerCasesPage() {
  const session = await getSession();

  if (!session) {
    redirect("/lex");
  }

  const initialCases = await listCases();
  const metrics = await getOperationalMetrics();

  return (
    <div className="min-h-screen bg-surface p-4 sm:p-6 lg:p-8">
      <OfficerCasesInboxClient initialCases={initialCases} metrics={metrics} />
    </div>
  );
}
