"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { FieldLabel } from "@/components/ui/field-label";
import { NIGERIAN_STATES } from "@/lib/constants";
import { normalizeNigerianPhone } from "@/lib/phone";
import { isBusinessAccount, isDeveloperAccount } from "@/lib/profile/basic-listing-profile";
import type { Profile } from "@/types/database";
import { friendlyPublicError, PUBLIC_ERROR_FALLBACK } from "@/lib/copy/public-errors";
import { Upload } from "lucide-react";
import { WhatsAppVerifyField } from "@/components/profile/whatsapp-verify-field";

export function BasicProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const isBusiness = isBusinessAccount(profile.account_type);
  const isDeveloper = isDeveloperAccount(profile.account_type);
  const isLandlord = profile.account_type === "landlord";
  const isAgentType = profile.account_type === "agent";

  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(profile.date_of_birth ?? "");
  const [phone, setPhone] = useState(profile.phone ?? profile.whatsapp ?? "");
  const [residentialAddress, setResidentialAddress] = useState(
    profile.residential_address ?? profile.office_address ?? ""
  );
  const [residentialArea, setResidentialArea] = useState(profile.residential_area ?? "");
  const [residentialCity, setResidentialCity] = useState(profile.residential_city ?? "");
  const [residentialState, setResidentialState] = useState(profile.residential_state ?? "");

  const [companyName, setCompanyName] = useState(profile.company_name ?? "");
  const [contactName, setContactName] = useState(
    profile.full_name && profile.full_name !== profile.company_name
      ? profile.full_name
      : profile.full_name ?? ""
  );
  const [cacFileName, setCacFileName] = useState("");
  const [cacDocumentPath, setCacDocumentPath] = useState(profile.cac_document_path ?? "");

  const [loading, setLoading] = useState(false);
  const [uploadingCac, setUploadingCac] = useState(false);
  const [error, setError] = useState("");

  async function handleCacUpload(file: File) {
    setUploadingCac(true);
    setError("");
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/agent/cac-upload", { method: "POST", body: form });
    const data = await res.json().catch(() => ({}));
    setUploadingCac(false);
    if (!res.ok) {
      setError(friendlyPublicError(data.error as string, PUBLIC_ERROR_FALLBACK));
      return;
    }
    setCacDocumentPath(data.path as string);
    setCacFileName(file.name);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = isBusiness
      ? {
          companyName,
          fullName: contactName,
          cacDocumentPath: cacDocumentPath || undefined,
          phone: normalizeNigerianPhone(phone),
          residentialAddress,
          residentialArea,
          residentialCity,
          residentialState,
        }
      : {
          fullName,
          dateOfBirth,
          phone: phone.trim() ? normalizeNigerianPhone(phone) : undefined,
          residentialAddress,
          residentialArea,
          residentialCity,
          residentialState,
        };

    const res = await fetch("/api/agent/profile-setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(friendlyPublicError(data.error as string, PUBLIC_ERROR_FALLBACK));
      return;
    }

    router.push("/agent/profile-setup/complete");
    router.refresh();
  }

  const profileTypeLabel = isDeveloper
    ? "Developer"
    : isBusiness
      ? "Company"
      : isLandlord
        ? "Landlord"
        : isAgentType
          ? "Agent"
          : "Individual";

  const businessNameLabel = isDeveloper ? "Company/Developer Name" : "Company Name";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm font-semibold text-navy">{profileTypeLabel}</p>

      {isBusiness ? (
        <>
          <div>
            <FieldLabel>{businessNameLabel}</FieldLabel>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              autoComplete="organization"
              className="h-12 rounded-xl"
            />
          </div>
          <div>
            <FieldLabel>Your Name</FieldLabel>
            <Input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              required
              autoComplete="name"
              className="h-12 rounded-xl"
            />
          </div>
          <WhatsAppVerifyField
            profile={profile}
            label="WhatsApp / Phone Number"
            required
            value={phone}
            onChange={setPhone}
            onVerified={() => router.refresh()}
          />
          <div>
            <FieldLabel>Address</FieldLabel>
            <Input
              value={residentialAddress}
              onChange={(e) => setResidentialAddress(e.target.value)}
              required
              autoComplete="street-address"
              className="h-12 rounded-xl"
            />
          </div>
        </>
      ) : (
        <>
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
          <WhatsAppVerifyField
            profile={profile}
            label="WhatsApp / Phone Number"
            value={phone}
            onChange={setPhone}
            onVerified={() => router.refresh()}
          />
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
        </>
      )}

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

      {isBusiness ? (
        <div>
          <FieldLabel>Upload CAC Certificates</FieldLabel>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleCacUpload(file);
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploadingCac}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-navy/20 bg-surface text-sm font-semibold text-navy pressable"
          >
            <Upload className="h-4 w-4" />
            {uploadingCac
              ? "Uploading…"
              : cacFileName || cacDocumentPath
                ? cacFileName || "Certificate uploaded"
                : "Upload CAC Certificates"}
          </button>
          <p className="mt-1 text-xs text-muted">PDF, JPG, PNG, or WebP — max 15MB</p>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        fullWidth
        disabled={loading || uploadingCac}
      >
        {loading ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
