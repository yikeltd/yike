import type { FieldOption } from "../types";

export type CatalogueEntry = {
  id: string;
  label: string;
  aliases?: string[];
};

export type ElectronicsBrandCatalog = Record<string, readonly CatalogueEntry[]>;

export type ElectronicsModelCatalog = Record<
  string,
  Record<string, readonly CatalogueEntry[]>
>;

export type CatalogueCoverageReport = {
  vertical: "property" | "vehicle" | "electronics";
  categories: number;
  brandsOrMakes: number;
  models: number;
  locationStates: number;
  notes: string[];
};

export type FieldOptionList = FieldOption[];
