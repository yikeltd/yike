import type { Metadata } from "next";
import { EventCatalogExperience } from "@/components/developers/event-catalog-experience";

export const metadata: Metadata = {
  title: "Webhook & System Event Catalog | Yike Developer Platform",
  description: "Comprehensive Webhook Event Catalog detailing trigger conditions, payload schemas, HMAC-SHA256 signatures, and delivery policies.",
};

export default function DeveloperEventsPage() {
  return (
    <main>
      <EventCatalogExperience />
    </main>
  );
}
