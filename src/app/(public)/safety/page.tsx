import Link from "next/link";
import { SAFETY_WARNING } from "@/lib/constants";

export default function SafetyPage() {
  return (
    <div className="space-y-6 pt-4">
      <h1 className="text-2xl font-bold">Safety on Yike</h1>
      <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
        {SAFETY_WARNING}
      </p>
      <ul className="list-disc space-y-3 pl-5 text-sm text-muted">
        <li>Always visit the property before paying any money.</li>
        <li>Do not pay &quot;inspection&quot; or &quot;agent&quot; fees upfront online.</li>
        <li>Verify the landlord or agent identity when possible.</li>
        <li>Use WhatsApp or call — Yike does not handle payments in the MVP.</li>
        <li>Report suspicious listings using the report button on each property.</li>
        <li>Look for the Verified badge on trusted agents and listings.</li>
      </ul>
      <Link href="/contact" className="text-sm font-medium text-primary">
        Contact support →
      </Link>
    </div>
  );
}
