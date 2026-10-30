export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { logStartupBanner } = await import("@/lib/startup-logging");
    const { validateProductionEnvironment } = await import(
      "@/lib/env-validation"
    );
    const { hydrateOtpServerTokenForLocalDev } = await import(
      "@/lib/otp/server-token"
    );
    const { hydrateSendchampKeysForLocalDev } = await import(
      "@/lib/notifications/providers/sendchamp-env-local"
    );
    logStartupBanner();
    validateProductionEnvironment();
    hydrateSendchampKeysForLocalDev();
    await hydrateOtpServerTokenForLocalDev();
  }
}
