export type Initial = {
  listingType?: string;
  hub?: string;
  propertyType?: string;
  state?: string;
  city?: string;
  area?: string;
  min?: string;
  max?: string;
};

export function chipKeyFromParams(params: {
  type?: string;
  hub?: string;
  propertyType?: string;
}) {
  if (params.hub === "land_sale") return "land";
  if (params.propertyType === "shop") return "shops";
  if (params.propertyType === "hotel") return "hotel";
  return params.type ?? "";
}
