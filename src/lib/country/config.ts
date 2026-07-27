/**
 * Multi-country marketplace metadata — prep only.
 * Nigeria is the only live market. Other countries are configuration stubs.
 */

export type CountryIso = "NG" | "KE" | "GH" | "UG" | "RW";

export type CountryConfig = {
  iso: CountryIso;
  name: string;
  currency: string;
  currencySymbol: string;
  phoneCountryCode: string;
  languages: string[];
  timezone: string;
  measurementSystem: "metric";
  live: boolean;
  paymentProviders: string[];
  verificationProviders: string[];
  featureFlags: {
    vehicles: boolean;
    properties: boolean;
    payments: boolean;
  };
  /** Location knowledge provider id — NG uses nigeriaLocations via YIP. */
  locationProvider: "nigeria" | "stub";
};

export const COUNTRY_CONFIGS: Record<CountryIso, CountryConfig> = {
  NG: {
    iso: "NG",
    name: "Nigeria",
    currency: "NGN",
    currencySymbol: "₦",
    phoneCountryCode: "+234",
    languages: ["en"],
    timezone: "Africa/Lagos",
    measurementSystem: "metric",
    live: true,
    paymentProviders: ["paystack"],
    verificationProviders: ["cac", "email", "phone"],
    featureFlags: { vehicles: true, properties: true, payments: true },
    locationProvider: "nigeria",
  },
  KE: {
    iso: "KE",
    name: "Kenya",
    currency: "KES",
    currencySymbol: "KSh",
    phoneCountryCode: "+254",
    languages: ["en", "sw"],
    timezone: "Africa/Nairobi",
    measurementSystem: "metric",
    live: false,
    paymentProviders: [],
    verificationProviders: ["email", "phone"],
    featureFlags: { vehicles: false, properties: false, payments: false },
    locationProvider: "stub",
  },
  GH: {
    iso: "GH",
    name: "Ghana",
    currency: "GHS",
    currencySymbol: "GH₵",
    phoneCountryCode: "+233",
    languages: ["en"],
    timezone: "Africa/Accra",
    measurementSystem: "metric",
    live: false,
    paymentProviders: [],
    verificationProviders: ["email", "phone"],
    featureFlags: { vehicles: false, properties: false, payments: false },
    locationProvider: "stub",
  },
  UG: {
    iso: "UG",
    name: "Uganda",
    currency: "UGX",
    currencySymbol: "USh",
    phoneCountryCode: "+256",
    languages: ["en"],
    timezone: "Africa/Kampala",
    measurementSystem: "metric",
    live: false,
    paymentProviders: [],
    verificationProviders: ["email", "phone"],
    featureFlags: { vehicles: false, properties: false, payments: false },
    locationProvider: "stub",
  },
  RW: {
    iso: "RW",
    name: "Rwanda",
    currency: "RWF",
    currencySymbol: "FRw",
    phoneCountryCode: "+250",
    languages: ["en", "rw", "fr"],
    timezone: "Africa/Kigali",
    measurementSystem: "metric",
    live: false,
    paymentProviders: [],
    verificationProviders: ["email", "phone"],
    featureFlags: { vehicles: false, properties: false, payments: false },
    locationProvider: "stub",
  },
};

export const DEFAULT_COUNTRY_ISO: CountryIso = "NG";

export function getCountryConfig(iso?: string | null): CountryConfig {
  const key = (iso?.trim().toUpperCase() || DEFAULT_COUNTRY_ISO) as CountryIso;
  return COUNTRY_CONFIGS[key] ?? COUNTRY_CONFIGS.NG;
}

export function listConfiguredCountries(): CountryConfig[] {
  return Object.values(COUNTRY_CONFIGS);
}

export function listLiveCountries(): CountryConfig[] {
  return listConfiguredCountries().filter((c) => c.live);
}

export function isCountryLive(iso: string | null | undefined): boolean {
  return getCountryConfig(iso).live;
}
