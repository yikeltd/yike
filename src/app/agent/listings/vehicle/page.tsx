import { UniversalListingWizard } from "@/components/listing-engine/universal-listing-wizard";

export const metadata = {
  title: "List Vehicle | Yike Marketplace",
  description: "Universal listing flow engine for vehicles and transport on Yike.",
};

export default function VehicleListingPage() {
  return (
    <main className="min-h-screen bg-[#f8fafc] py-6">
      <UniversalListingWizard categoryId="vehicles" />
    </main>
  );
}
