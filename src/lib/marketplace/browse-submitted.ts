/** True when the user has an active browse/search — hide discovery chrome (large search, chip rows). */

function first(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

export function isVehicleBrowseSubmitted(
  sp: Record<string, string | string[] | undefined>,
): boolean {
  const conditionParam = first(sp.condition);
  const verifiedOnly = first(sp.verified) === "1";
  const featuredOnly = first(sp.featured) === "1";
  const nearbyFlag = first(sp.nearby) === "1";
  return Boolean(
    first(sp.q) ||
      first(sp.category) ||
      first(sp.group) ||
      conditionParam ||
      first(sp.make) ||
      first(sp.model) ||
      first(sp.state) ||
      first(sp.city) ||
      first(sp.min_year) ||
      first(sp.max_year) ||
      first(sp.min_price) ||
      first(sp.max_price) ||
      first(sp.max_mileage) ||
      first(sp.max_operating_hours) ||
      first(sp.transmission) ||
      first(sp.fuel) ||
      verifiedOnly ||
      featuredOnly ||
      nearbyFlag ||
      (first(sp.page) && first(sp.page) !== "1"),
  );
}

export function isElectronicsBrowseSubmitted(
  sp: Record<string, string | string[] | undefined>,
): boolean {
  return Boolean(
    first(sp.q) ||
      first(sp.category) ||
      first(sp.brand) ||
      first(sp.condition) ||
      first(sp.state) ||
      first(sp.city) ||
      first(sp.min_price) ||
      first(sp.max_price),
  );
}
