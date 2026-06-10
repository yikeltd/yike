import { requireServerClient } from "@/lib/supabase/require-client";
import { notFound } from "next/navigation";
import { AdminListingEditor } from "@/components/admin/admin-listing-editor";
import type { Property, Profile } from "@/types/database";

export default async function AdminListingEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await requireServerClient();

  const { data } = await supabase
    .from("properties")
    .select(
      `*, agent:profiles!properties_agent_id_fkey (
        id, full_name, email, phone, whatsapp, role, verification_status, verified_badge, listing_limit,
        public_agent_code, public_slug
      )`
    )
    .eq("id", id)
    .single();

  if (!data) notFound();

  const listing = data as Property & { agent: Profile | null };

  return <AdminListingEditor listing={listing} />;
}
