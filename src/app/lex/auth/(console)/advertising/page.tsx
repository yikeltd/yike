import { AdvertisementsBoard } from "@/components/admin/advertisements-board";
import { AdminSectionTabs } from "@/components/admin/shell/admin-section-tabs";
import { PROMOTIONS_SECTION_TABS } from "@/lib/admin/navigation";

export default function AdvertisingPage() {
  return (
    <div className="space-y-6">
      <AdminSectionTabs tabs={PROMOTIONS_SECTION_TABS} />
      <section>
        <h1 className="text-2xl font-bold">Advertisement Manager</h1>
        <p className="text-sm text-muted">
          Homepage slots 1–5 and search. Active only when enabled and within
          start/end dates. Empty slots collapse on the homepage — no placeholders.
        </p>
      </section>
      <AdvertisementsBoard />
    </div>
  );
}
