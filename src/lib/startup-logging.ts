import { getApplicationIdentity } from "./application-identity";

let logged = false;

export function logStartupBanner(options: { port?: number } = {}): void {
  if (logged) return;
  logged = true;

  const identity = getApplicationIdentity();
  const port = options.port ?? Number(process.env.PORT || 3000);
  const startedAt = new Date().toISOString();

  console.log(
    `[${identity.applicationId}] startup application=${identity.applicationName} version=${identity.version} environment=${identity.environment} platform=${identity.platform} provider=${identity.provider} commit=${identity.commit ?? "local"} port=${port} node=${process.version} startedAt=${startedAt}`,
  );
}
