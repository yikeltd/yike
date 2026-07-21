export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { logStartupBanner } = await import("@/lib/startup-logging");
    logStartupBanner();
  }
}
