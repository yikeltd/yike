import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { AdminListingEditor } from "@/components/admin/admin-listing-editor";
import type { Property, Profile } from "@/types/database";

export default async function AdminListingEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("properties")
    .select(
      `*, agent:profiles!properties_agent_id_fkey (
        id, full_name, email, phone, whatsapp, role, verification_status, verified_badge, listing_limit,
        public_agent_code, public_slug
      )`
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error("[lex/listings/id]", error.message);
  }
  if (!data) notFound();

  const listing = data as Property & { agent: Profile | null };

  return <AdminListingEditor listing={listing} />;
}
