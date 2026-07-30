import { UniversalListingWizard } from "@/components/listing-engine/universal-listing-wizard";

export const metadata = {
  title: "List Property | Yike Marketplace",
  description: "Universal listing flow engine for real estate and properties on Yike.",
};

export default function PropertyListingPage() {
  return (
    <main className="min-h-screen bg-[#f8fafc] py-6">
      <UniversalListingWizard categoryId="properties" />
    </main>
  );
}
