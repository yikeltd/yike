import {
  getEnterpriseCapability,
  isPassportIntegrationActive,
  sellerKindFromAccountType,
} from "@/lib/enterprise/adapters";
import type { AccountType } from "@/types/database";

/**
 * Marketplace Passport bind-point UI — never implements Passport runtime.
 * Shows readiness / deferred state until Stankings SDK is ready.
 */
export function PassportReadinessNotice({
  accountType,
  compact,
}: {
  accountType?: AccountType | string | null;
  compact?: boolean;
}) {
  const kind = sellerKindFromAccountType(accountType);
  const passport = getEnterpriseCapability("passport");
  const live = isPassportIntegrationActive();

  if (live) {
    return (
      <p
        className={
          compact
            ? "text-xs font-medium text-emerald-800"
            : "rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-900"
        }
      >
        Passport verification is available for this {kind} profile.
      </p>
    );
  }

  return (
    <p
      className={
        compact
          ? "text-xs text-muted"
          : "rounded-xl border border-navy/10 bg-surface/60 px-3 py-2 text-xs text-navy/80"
      }
    >
      <span className="font-semibold text-navy">Passport-ready profile.</span>{" "}
      Yike will consume Stankings Passport when it ships ({passport.state}). Local
      marketplace badges stay in place until then.
    </p>
  );
}
