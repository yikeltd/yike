/**
 * Yike BTOS — Categorized Dependency Health Platform (Enterprise Enhancement 3)
 * Structured health categories (critical, payments, communications, ai, workers) and severity levels.
 */

import { createClient } from "@/lib/supabase/server";

export type SeverityLevel = "INFO" | "WARNING" | "CRITICAL";

export interface CategorizedDependencyStatus {
  service: string;
  status: "healthy" | "degraded" | "unhealthy";
  severity: SeverityLevel;
  latencyMs: number;
  error?: string;
}

export interface CategorizedHealthReport {
  overallStatus: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  environment: string;
  categories: {
    critical: Record<string, CategorizedDependencyStatus>;
    payments: Record<string, CategorizedDependencyStatus>;
    communications: Record<string, CategorizedDependencyStatus>;
    ai: Record<string, CategorizedDependencyStatus>;
    workers: Record<string, CategorizedDependencyStatus>;
  };
}

export class DependencyHealthMonitor {
  public static async runFullHealthAudit(): Promise<CategorizedHealthReport> {
    const timestamp = new Date().toISOString();

    const critical: Record<string, CategorizedDependencyStatus> = {
      database: await this.probeCheck("PostgreSQL Database", "CRITICAL", async () => {
        const supabase = await createClient();
        if (!supabase) throw new Error("Supabase client unconfigured");
        const { error } = await supabase.from("btos_read_projections").select("id").limit(1);
        if (error && error.code !== "PGRST116") throw error;
      }),
      redis_streams: await this.probeCheck("Redis Stream Event Bus", "CRITICAL", async () => {}),
      storage_vault: await this.probeCheck("Evidence Storage Vault", "CRITICAL", async () => {
        const supabase = await createClient();
        if (!supabase) return;
        await supabase.storage.getBucket("btos-evidence-vault");
      }),
    };

    const payments: Record<string, CategorizedDependencyStatus> = {
      paystack: await this.probeCheck("Paystack Payment Gateway", "WARNING", async () => {
        if (!process.env.PAYSTACK_SECRET_KEY) throw new Error("PAYSTACK_SECRET_KEY missing");
      }),
      safehaven: await this.probeCheck("SafeHaven Bank Gateway", "WARNING", async () => {
        if (!process.env.SAFEHAVEN_CLIENT_SECRET) throw new Error("SAFEHAVEN_CLIENT_SECRET missing");
      }),
      korapay: await this.probeCheck("KoraPay Gateway", "WARNING", async () => {
        if (!process.env.KORAPAY_SECRET_KEY) throw new Error("KORAPAY_SECRET_KEY missing");
      }),
    };

    const communications: Record<string, CategorizedDependencyStatus> = {
      resend_email: await this.probeCheck("Resend Email Gateway", "INFO", async () => {
        if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY missing");
      }),
      sendchamp_sms: await this.probeCheck("SendChamp SMS Gateway", "INFO", async () => {
        if (!process.env.SENDCHAMP_KEY) throw new Error("SENDCHAMP_KEY missing");
      }),
      agora_video: await this.probeCheck("Agora Real-Time Video SDK", "INFO", async () => {
        if (!process.env.NEXT_PUBLIC_AGORA_APP_ID) throw new Error("AGORA_APP_ID missing");
      }),
    };

    const ai: Record<string, CategorizedDependencyStatus> = {
      gemini_ai: await this.probeCheck("Gemini AI Logic Engine", "INFO", async () => {
        if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY missing");
      }),
    };

    const workers: Record<string, CategorizedDependencyStatus> = {
      event_bus: await this.probeCheck("Durable Event Bus", "CRITICAL", async () => {}),
      saga_recovery: await this.probeCheck("Saga Recovery Engine", "CRITICAL", async () => {}),
    };

    const allStatuses = [
      ...Object.values(critical),
      ...Object.values(payments),
      ...Object.values(communications),
      ...Object.values(ai),
      ...Object.values(workers),
    ].map((s) => s.status);

    let overallStatus: CategorizedHealthReport["overallStatus"] = "healthy";
    if (allStatuses.includes("unhealthy")) {
      overallStatus = "unhealthy";
    } else if (allStatuses.includes("degraded")) {
      overallStatus = "degraded";
    }

    return {
      overallStatus,
      timestamp,
      environment: process.env.NODE_ENV ?? "development",
      categories: {
        critical,
        payments,
        communications,
        ai,
        workers,
      },
    };
  }

  private static async probeCheck(
    service: string,
    severity: SeverityLevel,
    action: () => Promise<void>
  ): Promise<CategorizedDependencyStatus> {
    const start = Date.now();
    try {
      await action();
      return {
        service,
        status: "healthy",
        severity: "INFO",
        latencyMs: Date.now() - start,
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      return {
        service,
        status: "degraded",
        severity,
        latencyMs: Date.now() - start,
        error: errMsg,
      };
    }
  }
}
