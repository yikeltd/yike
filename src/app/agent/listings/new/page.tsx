import { requireAgent } from "@/lib/auth";
import { ListingForm } from "@/components/agent/listing-form";

export default async function NewListingPage() {
  const { user } = await requireAgent();

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-3 pt-2 pb-8 lg:px-0 lg:py-8">
      <div>
        <h1 className="text-xl font-bold text-navy lg:text-2xl">New listing</h1>
        <p className="mt-1 text-sm text-muted">
          Listings are reviewed before going live. WhatsApp must be on your profile.
        </p>
      </div>
      <ListingForm agentId={user.id} />
    </div>
  );
}
