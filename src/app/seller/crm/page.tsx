import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getSellerCrmSnapshot } from "@/lib/seller-crm/service";
import { CrmWorkspaceClient } from "./crm-workspace-client";

export const metadata = {
  title: "Seller Success Platform & CRM | Yike Business Cloud",
  description: "Operating system for agents, dealerships, developers, and landlords to manage leads, inventory health, viewings, and offers.",
};

export default async function SellerCrmPage() {
  const session = await getSession();

  if (!session) {
    redirect("/auth/login?next=/seller/crm");
  }

  const initialSnapshot = await getSellerCrmSnapshot(session.id);

  return (
    <div className="min-h-screen bg-surface p-4 sm:p-6 lg:p-8">
      <CrmWorkspaceClient initialSnapshot={initialSnapshot} />
    </div>
  );
}
