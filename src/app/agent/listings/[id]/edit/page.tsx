import { redirect } from "next/navigation";
import { requireVerifiedLister } from "@/lib/auth";
import { requireServerClient } from "@/lib/supabase/require-client";
import { ListingForm } from "@/components/agent/listing-form";
import { AgentReviewResponseBox } from "@/components/agent/agent-review-response-box";
import type { Property } from "@/types/database";

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user } = await requireVerifiedLister();
  const { id } = await params;
  const supabase = await requireServerClient();
  const { data } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .eq("agent_id", user.id)
    .single();

  if (!data) redirect("/agent/listings");

  const { data: driverRows } = await supabase
    .from("listing_value_drivers")
    .select("driver_key")
    .eq("listing_id", id);

  const initialValueDriverKeys =
    driverRows?.map((r) => r.driver_key as string) ?? [];

  return (
    <div className="space-y-4 px-3 pt-2 pb-8">
      <h1 className="text-xl font-bold">Edit listing</h1>
      <AgentReviewResponseBox listingId={id} />
      <ListingForm
        agentId={user.id}
        initial={data as Property}
        initialValueDriverKeys={initialValueDriverKeys}
      />
    </div>
  );
}
