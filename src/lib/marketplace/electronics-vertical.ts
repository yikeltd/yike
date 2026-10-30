import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  getVertical,
  type MarketplaceVertical,
  type MarketplaceVerticalId,
} from "@/lib/marketplace/verticals";
import { normalizeAssetType } from "@/lib/marketplace/listings";

export const ELECTRONICS_VERTICAL_ID: MarketplaceVerticalId = "electronics";

/** Public browse route (not implemented until vertical status is live). */
export const ELECTRONICS_PUBLIC_HREF = "/electronics";

export function getElectronicsVertical(): MarketplaceVertical | undefined {
  return getVertical(ELECTRONICS_VERTICAL_ID);
}

/** True only when registry marks electronics as live or launching. */
export function isElectronicsMarketplaceLive(): boolean {
  const v = getElectronicsVertical();
  return v?.status === "live" || v?.status === "launching";
}

/** Seller create route declared in vertical registry. */
export function electronicsCreateHref(): string {
  return getElectronicsVertical()?.createHref ?? "/agent/listings/new/electronics";
}

export function isElectronicsAssetType(
  assetType: string | null | undefined,
): boolean {
  return normalizeAssetType(assetType) === "ELECTRONICS";
}

/**
 * Property create must not accept cross-vertical asset_type overrides.
 * Electronics listings require a dedicated API + listing engine (not implemented).
 */
export function rejectCrossVerticalAssetTypePayload(
  payload: Record<string, unknown>,
): { ok: true } | { ok: false; error: string; code: string } {
  const raw = payload.asset_type;
  if (raw === undefined || raw === null || raw === "") {
    return { ok: true };
  }
  const normalized = normalizeAssetType(String(raw));
  if (normalized === "PROPERTY") {
    return { ok: true };
  }
  return {
    ok: false,
    error:
      "This form only supports property listings. Choose Vehicles or wait for Electronics launch.",
    code: "unsupported_asset_type",
  };
}

/** Repo layout probes for QA harnesses (no network). */
export function electronicsImplementationProbe(): {
  verticalStatus: MarketplaceVertical["status"] | "missing";
  publicAppRouteExists: boolean;
  sellerCreateRouteExists: boolean;
  listingEngineCategoryExists: boolean;
  dedicatedCreateApiExists: boolean;
} {
  const root = process.cwd();
  const v = getElectronicsVertical();
  return {
    verticalStatus: v?.status ?? "missing",
    publicAppRouteExists: existsSync(
      join(root, "src/app/(public)/electronics"),
    ),
    sellerCreateRouteExists: existsSync(
      join(root, "src/app/agent/listings/new/electronics"),
    ),
    listingEngineCategoryExists: existsSync(
      join(root, "src/lib/listing-engine/categories/electronics.ts"),
    ),
    dedicatedCreateApiExists: existsSync(
      join(root, "src/app/api/agent/electronics"),
    ),
  };
}
