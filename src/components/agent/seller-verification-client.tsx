"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { NIGERIAN_STATES } from "@/lib/constants";
import {
  buildSellerTrustProgress,
  isPhoneVerifiedForSeller,
  isSellerProfileComplete,
  SELLER_CHOOSE_LISTING_PATH,
  SELLER_VERIFICATION_CONSENT,
  SELLER_VERIFICATION_COPY,
} from "@/lib/seller-trust";
import { friendlyPublicError, PUBLIC_ERROR_FALLBACK } from "@/lib/copy/public-errors";
import { SellerTrustProgress } from "@/components/agent/seller-trust-progress";
import { SellerPhoneVerifyRow } from "@/components/agent/seller-phone-verify-row";
import type { Profile } from "@/types/database";

export function SellerVerificationClient({
  profile: initialProfile,
  emailVerified,
}: {
  profile: Profile;
  emailVerified: boolean;
}) {
  const router = useRouter();
  const [profile, setProfile] = useState(initialProfile);
  const [phoneVerified, setPhoneVerified] = useState(
    isPhoneVerifiedForSeller(initialProfile)
  );
  const [phoneVerifiedAt, setPhoneVerifiedAt] = useState(
    initialProfile.phone_verified_at ?? initialProfile.whatsapp_verified_at ?? null
  );

  const [state, setState] = useState(initialProfile.residential_state ?? "");
  const [address, setAddress] = useState(
    initialProfile.residential_address ?? initialProfile.office_address ?? ""
  );
  const [dateOfBirth, setDateOfBirth] = useState(initialProfile.date_of_birth ?? "");
  const [occupation, setOccupation] = useState("");
  const [referralCode, setReferralCode] = useState(
    initialProfile.referral_code_used ?? ""
  );
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const submitLockRef = useRef(false);

  // Keep local trust state in sync when the server profile refreshes (no manual reload).
  useEffect(() => {
    setProfile(initialProfile);
    const verified = isPhoneVerifiedForSeller(initialProfile);
    setPhoneVerified(verified);
    setPhoneVerifiedAt(
      initialProfile.phone_verified_at ?? initialProfile.whatsapp_verified_at ?? null
    );
    if (verified) {
      setError((prev) =>
        prev === "Verify your phone number first." ? "" : prev
      );
    }
  }, [initialProfile]);

  const progress = useMemo(
    () =>
      buildSellerTrustProgress(
        {
          ...profile,
          phone_verified: phoneVerified,
          phone_verified_at: phoneVerifiedAt,
          whatsapp_verified_at: phoneVerified
            ? phoneVerifiedAt ?? profile.whatsapp_verified_at
            : profile.whatsapp_verified_at,
          whatsapp_verification_status: phoneVerified
            ? "verified"
            : profile.whatsapp_verification_status,
          email_verified: emailVerified || profile.email_verified,
          date_of_birth: dateOfBirth || profile.date_of_birth,
          residential_address: address || profile.residential_address,
          residential_state: state || profile.residential_state,
        },
        { emailVerified }
      ),
    [profile, phoneVerified, phoneVerifiedAt, emailVerified, dateOfBirth, address, state]
  );

  const profileAlreadyComplete =
    isSellerProfileComplete(profile) &&
    phoneVerified &&
    profile.verification_status !== "rejected";

  function applyPhoneVerified(phone: string, verifiedAt: string) {
    setPhoneVerified(true);
    setPhoneVerifiedAt(verifiedAt);
    setError("");
    setProfile((p) => ({
      ...p,
      phone,
      whatsapp: phone,
      phone_verified: true,
      phone_verified_at: verifiedAt,
      whatsapp_verified_at: verifiedAt,
      whatsapp_verification_status: "verified",
    }));
    router.refresh();
  }

  async function completeVerification() {
    if (submitLockRef.current || loading) return;
    if (!phoneVerified) {
      setError("Verify your phone number first.");
      return;
    }
    if (!consent) {
      setError("Confirm the accuracy consent to continue.");
      return;
    }
    submitLockRef.current = true;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/agent/seller-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          residentialState: state,
          residentialAddress: address,
          dateOfBirth,
          occupation,
          referralCode: referralCode.trim() || undefined,
          consentAccepted: true,
          accountType: profile.account_type ?? "individual",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const apiError = friendlyPublicError(
          data.error as string,
          PUBLIC_ERROR_FALLBACK
        );
        // Phone already verified locally — never keep the stale gate message.
        if (
          data.code === "phone_verification_required" &&
          phoneVerified
        ) {
          setError("");
          router.refresh();
          setError(
            "Phone status is updating. Wait a moment, then try again."
          );
          return;
        }
        setError(apiError);
        return;
      }
      router.push((data.next as string) || SELLER_CHOOSE_LISTING_PATH);
      router.refresh();
    } finally {
      setLoading(false);
      submitLockRef.current = false;
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-5 px-3 pb-10 pt-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-navy">
          {SELLER_VERIFICATION_COPY.title}
        </h1>
      </div>

      <SellerTrustProgress
        items={progress}
        title={SELLER_VERIFICATION_COPY.progressTitle}
      />

      <section className="space-y-3 rounded-2xl border border-navy/10 bg-white p-4">
        <h2 className="text-sm font-bold text-navy">1. Personal details</h2>
        <label className="block text-xs font-semibold text-navy">
          Full Name
          <Input
            value={profile.full_name ?? ""}
            readOnly
            className="mt-1 h-11 rounded-xl bg-surface/60 text-navy/80"
          />
        </label>
        <label className="block text-xs font-semibold text-navy">
          Email
          <Input
            value={profile.email ?? ""}
            readOnly
            className="mt-1 h-11 rounded-xl bg-surface/60 text-navy/80"
          />
        </label>
        <SellerPhoneVerifyRow
          phoneNumber={profile.phone ?? profile.whatsapp ?? ""}
          verified={phoneVerified}
          verifiedAt={phoneVerifiedAt}
          onVerified={applyPhoneVerified}
        />
      </section>

      {phoneVerified ? (
        <section className="space-y-3 rounded-2xl border border-navy/10 bg-white p-4">
          <h2 className="text-sm font-bold text-navy">2. Seller profile</h2>

          <label className="block text-xs font-semibold text-navy">
            State <span className="text-danger">*</span>
            <Select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="mt-1 h-11 rounded-xl"
              required
            >
              <option value="">Select state</option>
              {NIGERIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </label>

          <label className="block text-xs font-semibold text-navy">
            Address <span className="text-danger">*</span>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              required
            />
          </label>

          <label className="block text-xs font-semibold text-navy">
            Date of Birth <span className="text-danger">*</span>
            <Input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="mt-1 h-11 rounded-xl"
              required
            />
          </label>

          <label className="block text-xs font-semibold text-navy">
            Occupation <span className="font-normal text-muted">(optional)</span>
            <Input
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              className="mt-1 h-11 rounded-xl"
            />
          </label>

          <label className="block text-xs font-semibold text-navy">
            Referral Code <span className="font-normal text-muted">(optional)</span>
            <Input
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              className="mt-1 h-11 rounded-xl"
            />
          </label>

          <label className="flex items-start gap-2.5 rounded-xl border border-navy/10 bg-surface/40 px-3 py-3 text-xs leading-relaxed text-navy">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#E4B547]"
            />
            <span>{SELLER_VERIFICATION_CONSENT}</span>
          </label>

          {error ? <p className="text-xs text-danger">{error}</p> : null}

          <Button
            type="button"
            variant="accent"
            size="lg"
            fullWidth
            className="font-bold"
            disabled={loading || !consent || !phoneVerified}
            onClick={() => void completeVerification()}
          >
            {loading ? "Saving…" : SELLER_VERIFICATION_COPY.completeCta}
          </Button>

          {profileAlreadyComplete ? (
            <button
              type="button"
              className="w-full text-center text-xs font-semibold text-gold-dark underline"
              onClick={() => router.push(SELLER_CHOOSE_LISTING_PATH)}
            >
              Already verified — choose listing type →
            </button>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
