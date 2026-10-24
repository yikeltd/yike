import type { Profile } from "@/types/database";
import { hasBasicListingProfile } from "@/lib/profile/basic-listing-profile";
import { getSellerContactPhone } from "@/lib/phone-verification/profile";
import { isPhoneVerifiedForSeller } from "@/lib/seller-trust";

export type SellerTrustLevel = "none" | "basic" | "business";

export function isPhoneReadyForSellerTrust(profile: Partial<Profile>): boolean {
  if (isPhoneVerifiedForSeller(profile)) return true;
  return Boolean(getSellerContactPhone(profile));
}

export function isBasicSellerVerified(profile: Partial<Profile>): boolean {
  if (!profile.id) return false;
  if (!profile.email_verified) return false;
  if (!isPhoneVerifiedForSeller(profile)) return false;
  if (!hasBasicListingProfile(profile)) return false;
  return true;
}

export function getSellerTrustLevel(
  profile: Partial<Profile> | null | undefined,
): SellerTrustLevel {
  if (!profile) return "none";
  if (profile.seller_verification_level === "business") return "business";
  if (
    profile.seller_verification_level === "basic" ||
    isBasicSellerVerified(profile)
  ) {
    return "basic";
  }
  return "none";
}

export function isBusinessSellerType(profile: Partial<Profile>): boolean {
  const accountType = profile.account_type;
  if (accountType === "agency" || accountType === "developer") return true;
  if (accountType === "landlord" && profile.company_name?.trim()) return true;
  if (profile.company_name?.trim() && profile.cac_number?.trim()) return true;
  return false;
}

export type SellerVerificationDocuments = {
  seller_type: "agent" | "business";
  id_document_path?: string;
  selfie_path?: string;
  cac_certificate_path?: string;
  rc_bn_number?: string;
  contact_phone?: string;
};

export function validateBusinessVerificationDocuments(
  profile: Partial<Profile>,
  documents: SellerVerificationDocuments,
): string | null {
  const business = isBusinessSellerType(profile);

  if (business) {
    if (!documents.cac_certificate_path?.trim()) {
      return "Upload your CAC certificate.";
    }
    if (!documents.rc_bn_number?.trim()) {
      return "Enter your RC or BN number.";
    }
    if (!documents.contact_phone?.trim()) {
      return "Enter a contact phone number.";
    }
    return null;
  }

  if (!documents.id_document_path?.trim()) {
    return "Upload a government-issued ID.";
  }
  return null;
}

/** Sync profile cache column (basic | business | null). */
export function resolveSellerVerificationLevel(
  profile: Partial<Profile>,
): "basic" | "business" | null {
  if (profile.seller_verification_level === "business") return "business";
  if (isBasicSellerVerified(profile)) return "basic";
  return null;
}

/** @deprecated Use isPhoneReadyForSellerTrust */
export const isWhatsappVerifiedForSellerTrust = isPhoneReadyForSellerTrust;
