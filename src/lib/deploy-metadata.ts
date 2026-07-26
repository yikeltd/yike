/** Ecosystem deployment metadata — identical field names across Stankings products. */

export type DeploymentMetadata = {
  application: string;
  version: string;
  environment: string;
  platform: string;
  provider: string;
  commit: string | null;
  buildTime: string | null;
  nodeEnv: string;
};

export function getDeploymentMetadata(application: string, version?: string): DeploymentMetadata {
  const resolvedVersion =
    version?.trim() ||
    process.env.APP_VERSION?.trim() ||
    process.env.npm_package_version?.trim() ||
    "0.0.0";

  return {
    application,
    version: resolvedVersion,
    environment: process.env.APP_ENV?.trim() || process.env.NODE_ENV || "unknown",
    platform: process.env.DEPLOY_PLATFORM?.trim() || "coolify",
    provider: process.env.DEPLOY_PROVIDER?.trim() || "hetzner",
    commit:
      process.env.GIT_COMMIT_SHA?.trim() ||
      process.env.COOLIFY_SOURCE_COMMIT?.trim() ||
      process.env.SOURCE_COMMIT?.trim() ||
      null,
    buildTime: process.env.BUILD_TIME?.trim() || null,
    nodeEnv: process.env.NODE_ENV || "unknown",
  };
}

export function getUptimeSeconds(): number {
  return Math.floor(process.uptime());
}

export function getDeployCommitShort(fallback = "local"): string {
  const deploy = getDeploymentMetadata("yike");
  return deploy.commit ? deploy.commit.slice(0, 12) : fallback;
}

export function getDeployEnvironment(): string {
  return getDeploymentMetadata("yike").environment;
}

export type StandardHealthPayload = DeploymentMetadata & {
  status: "ok" | "degraded" | "maintenance";
  uptime: number;
  database: string;
  timestamp: string;
};

export function buildStandardHealthPayload(input: {
  application: string;
  version?: string;
  status?: StandardHealthPayload["status"];
  database?: string;
  diagnostics?: Record<string, unknown>;
  extra?: Record<string, unknown>;
}): StandardHealthPayload & { diagnostics?: Record<string, unknown> } {
  const deploy = getDeploymentMetadata(input.application, input.version);
  const payload = {
    status: input.status ?? "ok",
    ...deploy,
    commit: deploy.commit,
    uptime: getUptimeSeconds(),
    database: input.database ?? "unknown",
    timestamp: new Date().toISOString(),
    ...(input.extra ?? {}),
  } as StandardHealthPayload & { diagnostics?: Record<string, unknown> };
  if (input.diagnostics && Object.keys(input.diagnostics).length > 0) {
    payload.diagnostics = input.diagnostics;
  }
  return payload;
}
