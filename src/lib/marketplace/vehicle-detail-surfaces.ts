/** Customer-facing vehicle detail sections — off until product is live. */

function envEnabled(name: string, defaultVisible: boolean): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  if (!raw) return defaultVisible;
  if (raw === "true" || raw === "1" || raw === "yes") return true;
  if (raw === "false" || raw === "0" || raw === "no") return false;
  return defaultVisible;
}

/** 150-point inspection block on `/vehicles/[slug]`. */
export function isVehicleMechanicInspectionUiVisible(): boolean {
  return envEnabled("NEXT_PUBLIC_ENABLE_VEHICLE_MECHANIC_INSPECTION_UI", false);
}

/** Auto finance estimator block and summary payment teaser. */
export function isVehicleFinanceEstimatorUiVisible(): boolean {
  return envEnabled("NEXT_PUBLIC_ENABLE_VEHICLE_FINANCE_ESTIMATOR_UI", false);
}
