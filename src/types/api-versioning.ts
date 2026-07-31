export type ApiVersionStatus =
  | "stable"
  | "preview"
  | "deprecated"
  | "experimental"
  | "internal"
  | "beta"
  | "ga"
  | "sunset";

export type ApiVersion = {
  version: string;
  status: ApiVersionStatus;
  releaseDate: string;
  sunsetDate?: string;
  description: string;
  isCurrent?: boolean;
};

export type ChangelogEntry = {
  version: string;
  date: string;
  title: string;
  features: string[];
  breakingChanges?: string[];
  migrationNotes?: string;
};

export type EndpointMigration = {
  oldEndpoint: string;
  newEndpoint: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  parameterChanges: string[];
  responseDiff: string;
  exampleRequestOld: string;
  exampleRequestNew: string;
  exampleResponseOld: string;
  exampleResponseNew: string;
};

export type MigrationGuide = {
  fromVersion: string;
  toVersion: string;
  summary: string;
  endpoints: EndpointMigration[];
};

export type SdkCompatibility = {
  sdkName: string;
  sdkVersion: string;
  supportedApiVersion: string;
  minVersion: string;
  latestVersion: string;
  status: ApiVersionStatus;
};
