import type { Metadata } from "next";
import { MonitoringDashboard } from "@/components/developers/monitoring-dashboard";

export const metadata: Metadata = {
  title: "Live Production Monitoring & Alerting | Yike Developer Platform",
  description: "Real-time CPU/RAM/Redis/Postgres metrics, third-party provider status, active alerts, and incident resolution timeline.",
};

export default function DeveloperMonitoringPage() {
  return (
    <main>
      <MonitoringDashboard />
    </main>
  );
}
