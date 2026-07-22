import { getDeploymentMetadata } from "./deploy-metadata";

/** Static product identity — runtime fields merged via getApplicationIdentity(). */
export const APPLICATION_IDENTITY = {
  applicationName: "Yike",
  applicationId: "yike",
  legalEntity: "YIKE LTD",
  repository: "yikeltd/yike",
  defaultDomain: "https://yike.ng",
  healthEndpoint: "/api/public-health",
  supportContact: "hello@yike.ng",
  supabaseProjectRef: "hlpojfurfldvcxfxhveg",
  supabaseOrganization: "Stankings Group",
  supabaseEnvironment: "production",
} as const;

export type ApplicationIdentity = typeof APPLICATION_IDENTITY & {
  version: string;
  environment: string;
  platform: string;
  provider: string;
  commit: string | null;
  buildTime: string | null;
  nodeEnv: string;
};

export function getApplicationIdentity(): ApplicationIdentity {
  const deploy = getDeploymentMetadata(APPLICATION_IDENTITY.applicationId);
  return {
    ...APPLICATION_IDENTITY,
    version: deploy.version,
    environment: deploy.environment,
    platform: deploy.platform,
    provider: deploy.provider,
    commit: deploy.commit,
    buildTime: deploy.buildTime,
    nodeEnv: deploy.nodeEnv,
  };
}
