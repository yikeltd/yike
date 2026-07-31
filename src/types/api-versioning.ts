export type VersionStatus = "active" | "beta" | "deprecated" | "sunset" | "stable" | "preview" | "ga" | "experimental" | "internal" | "compatible" | "update_recommended" | "unsupported";
export type ApiVersionStatus = VersionStatus;

export type ApiVersion = {
  id: string;
  versionNumber: string;
  releaseDate: string;
  status: VersionStatus;
  deprecationDate?: string;
  sunsetDate?: string;
  breakingChangesCount: number;
  activeIntegrations: number;
  description: string;
};

export type SdkCompatibility = {
  sdkName: string;
  language?: string;
  latestVersion: string;
  sdkVersion?: string;
  supportedApiVersions?: string[];
  supportedApiVersion?: string;
  minVersion?: string;
  status: VersionStatus;
};

export type DeprecationPolicy = {
  policyVersion: string;
  minimumNoticeMonths: number;
  sunsetWindowMonths: number;
  activeSunsetNotices: number;
};

export type ChangelogEntry = {
  id?: string;
  version: string;
  date: string;
  title: string;
  description?: string;
  category?: "feature" | "improvement" | "fix" | "breaking" | "security";
  features?: string[];
  breakingChanges?: string[];
  migrationNotes?: string;
};

export type MigrationGuide = {
  id?: string;
  fromVersion: string;
  toVersion: string;
  title?: string;
  overview?: string;
  summary?: string;
  endpoints?: Array<{
    method?: string;
    path?: string;
    oldEndpoint?: string;
    newEndpoint?: string;
    change?: string;
    parameterChanges?: string[];
    responseDiff?: unknown;
    exampleRequestOld?: string;
    exampleRequestNew?: string;
    exampleResponseOld?: string;
    exampleResponseNew?: string;
  }>;
  affectedEndpoints?: Array<{ method: string; path: string; change: string }>;
  codeExamples?: Array<{ language: string; before: string; after: string }>;
};
