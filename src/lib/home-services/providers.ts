import { randomBytes } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ServiceProviderType } from "@/constants/serviceProviders";
import { getServiceProviderTypeLabel, isValidServiceProviderType } from "@/constants/serviceProviders";
import { ensureTrustScoreRow } from "@/lib/trust/score-engine/events";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function generateProviderReference(): string {
  return `SP-${randomBytes(3).toString("hex").toUpperCase()}`;
}

export function generateServiceRequestReference(): string {
  return `SR-${randomBytes(3).toString("hex").toUpperCase()}`;
}

export async function approveServiceProviderApplication(
  client: SupabaseClient,
  input: {
    applicationId: string;
    approvedBy: string;
    reviewNotes?: string;
  }
): Promise<{ ok: boolean; error?: string; providerId?: string }> {
  const { data: app } = await client
    .from("service_provider_applications")
    .select("*")
    .eq("id", input.applicationId)
    .single();

  if (!app) return { ok: false, error: "Application not found" };
  if (app.status === "approved") return { ok: false, error: "Already approved" };
  if (!isValidServiceProviderType(app.provider_type)) {
    return { ok: false, error: "Invalid provider type" };
  }

  const now = new Date().toISOString();
  const baseSlug = slugify(app.business_name || app.full_name);
  const slug = `${baseSlug}-${randomBytes(2).toString("hex")}`;
  const ref = generateProviderReference();

  const { data: provider, error } = await client
    .from("service_provider_profiles")
    .insert({
      application_id: app.id,
      provider_reference: ref,
      provider_type: app.provider_type as ServiceProviderType,
      business_name: app.business_name,
      full_name: app.full_name,
      slug,
      bio: app.bio,
      profile_image: app.profile_image_url,
      city: app.city,
      state: app.state,
      service_areas: app.service_areas ?? [],
      whatsapp: app.whatsapp,
      phone: app.phone,
      years_experience: app.years_experience,
      verification_status: "approved",
      trust_status: "neutral",
      availability_status: "limited",
      approved_by: input.approvedBy,
      approved_at: now,
      last_activity_at: now,
    })
    .select("id")
    .single();

  if (error || !provider) {
    return { ok: false, error: error?.message ?? "Could not create provider profile" };
  }

  await client
    .from("service_provider_applications")
    .update({
      status: "approved",
      reviewed_by: input.approvedBy,
      reviewed_at: now,
      review_notes: input.reviewNotes ?? null,
      updated_at: now,
    })
    .eq("id", app.id);

  await ensureTrustScoreRow(client, "service_provider", provider.id);

  return { ok: true, providerId: provider.id };
}

export async function updateProviderStatus(
  client: SupabaseClient,
  providerId: string,
  status: string,
  adminNotes?: string
): Promise<void> {
  const patch: Record<string, unknown> = {
    verification_status: status,
    updated_at: new Date().toISOString(),
  };
  if (adminNotes) patch.admin_notes = adminNotes;
  if (status === "approved") {
    patch.approved_at = new Date().toISOString();
    patch.availability_status = "limited";
  }
  if (status === "suspended" || status === "fraud_review") {
    patch.availability_status = "paused";
  }
  await client.from("service_provider_profiles").update(patch).eq("id", providerId);
}

export function providerDisplayName(row: {
  business_name?: string | null;
  full_name: string;
  provider_type: string;
}): string {
  return row.business_name?.trim() || row.full_name || getServiceProviderTypeLabel(row.provider_type);
}
