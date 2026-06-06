import { redirect } from "next/navigation";
import { requireVerifiedLister } from "@/lib/auth";
import { requireServerClient } from "@/lib/supabase/require-client";
import { ListingForm } from "@/components/agent/listing-form";
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

  return (
    <div className="space-y-4 px-3 pt-2 pb-8">
      <h1 className="text-xl font-bold">Edit listing</h1>
      <ListingForm agentId={user.id} initial={data as Property} />
    </div>
  );
}
