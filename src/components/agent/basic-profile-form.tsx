"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { FieldLabel } from "@/components/ui/field-label";
import { NIGERIAN_STATES } from "@/lib/constants";
import { normalizeNigerianPhone } from "@/lib/phone";
import { BASIC_PROFILE_SETUP_MESSAGE } from "@/lib/profile/basic-listing-profile";
import type { Profile } from "@/types/database";
import { friendlyPublicError, PUBLIC_ERROR_FALLBACK } from "@/lib/copy/public-errors";

export function BasicProfileForm({
  profile,
  nextPath = "/agent/listings/new",
}: {
  profile: Profile;
  nextPath?: string;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(profile.date_of_birth ?? "");
  const [phone, setPhone] = useState(profile.phone ?? profile.whatsapp ?? "");
  const [residentialAddress, setResidentialAddress] = useState(
    profile.residential_address ?? profile.office_address ?? ""
  );
  const [residentialArea, setResidentialArea] = useState(profile.residential_area ?? "");
  const [residentialCity, setResidentialCity] = useState(profile.residential_city ?? "");
  const [residentialState, setResidentialState] = useState(profile.residential_state ?? "");
  const [residentialPostalCode, setResidentialPostalCode] = useState(
    profile.residential_postal_code ?? ""
  );
  const [country, setCountry] = useState(profile.country ?? "Nigeria");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/agent/profile-setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName,
        dateOfBirth,
        phone: phone.trim() ? normalizeNigerianPhone(phone) : undefined,
        residentialAddress,
        residentialArea,
        residentialCity,
        residentialState,
        residentialPostalCode,
        country,
      }),
    });

    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(friendlyPublicError(data.error as string, PUBLIC_ERROR_FALLBACK));
      return;
    }

    router.push(nextPath);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted">{BASIC_PROFILE_SETUP_MESSAGE}</p>

      <div>
        <FieldLabel>Full Name</FieldLabel>
        <Input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          autoComplete="name"
          className="h-12 rounded-xl"
        />
      </div>

      <div>
        <FieldLabel>Date of Birth</FieldLabel>
        <Input
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          required
          className="h-12 rounded-xl"
        />
      </div>

      <div>
        <FieldLabel>Phone Number</FieldLabel>
        <Input
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(normalizeNigerianPhone(e.target.value))}
          placeholder="Optional — for listing contact"
          className="h-12 rounded-xl"
          autoComplete="tel"
        />
      </div>

      <div>
        <FieldLabel>Street Address</FieldLabel>
        <Input
          value={residentialAddress}
          onChange={(e) => setResidentialAddress(e.target.value)}
          required
          autoComplete="street-address"
          className="h-12 rounded-xl"
        />
      </div>

      <div>
        <FieldLabel>Area / Neighbourhood</FieldLabel>
        <Input
          value={residentialArea}
          onChange={(e) => setResidentialArea(e.target.value)}
          className="h-12 rounded-xl"
        />
      </div>

      <div>
        <FieldLabel>City</FieldLabel>
        <Input
          value={residentialCity}
          onChange={(e) => setResidentialCity(e.target.value)}
          required
          autoComplete="address-level2"
          className="h-12 rounded-xl"
        />
      </div>

      <div>
        <FieldLabel>State</FieldLabel>
        <Select
          value={residentialState}
          onChange={(e) => setResidentialState(e.target.value)}
          required
          className="h-12 rounded-xl"
        >
          <option value="">Select state</option>
          {NIGERIAN_STATES.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <FieldLabel>Country</FieldLabel>
        <Input
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          required
          autoComplete="country-name"
          className="h-12 rounded-xl"
        />
      </div>

      <div>
        <FieldLabel>Postal Code / ZIP Code</FieldLabel>
        <Input
          value={residentialPostalCode}
          onChange={(e) => setResidentialPostalCode(e.target.value)}
          className="h-12 rounded-xl"
          autoComplete="postal-code"
        />
      </div>

      {error ? (
        <p className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <Button type="submit" fullWidth disabled={loading}>
        {loading ? "Saving…" : "Continue to listing"}
      </Button>
    </form>
  );
}
