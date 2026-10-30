/** Whether homepage marketplace filters have a meaningful selection (not just opening the panel). */

export function propertyMarketplaceMeaningfulSelection(input: {
  dealKey: string;
  state: string;
  city: string;
  area: string;
  propertyType: string;
  budget: string;
}): boolean {
  return Boolean(
    input.dealKey ||
      input.state ||
      input.city ||
      input.area ||
      input.propertyType ||
      input.budget,
  );
}

export function vehicleMarketplaceMeaningfulSelection(input: {
  category: string;
  state: string;
  city: string;
  make: string;
  carType: string;
  budget: string;
}): boolean {
  return Boolean(
    input.category ||
      input.state ||
      input.city ||
      input.make ||
      input.carType ||
      input.budget,
  );
}

export function electronicsMarketplaceMeaningfulSelection(input: {
  category: string;
  state: string;
  city: string;
  condition: string;
  budget: string;
}): boolean {
  return Boolean(
    input.category ||
      input.state ||
      input.city ||
      input.condition ||
      input.budget,
  );
}
