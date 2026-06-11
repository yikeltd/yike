import { AdvertisementsBoard } from "@/components/admin/advertisements-board";
import { AdminSectionTabs } from "@/components/admin/shell/admin-section-tabs";
import { PROMOTIONS_SECTION_TABS } from "@/lib/admin/navigation";

export default function AdvertisingPage() {
  return (
    <div className="space-y-6">
      <AdminSectionTabs tabs={PROMOTIONS_SECTION_TABS} />
      <section>
        <h1 className="text-2xl font-bold">Advertising</h1>
        <p className="text-sm text-muted">
          Sponsored opportunities — homepage & search. Max one active per placement. Label: Sponsored.
        </p>
      </section>
      <AdvertisementsBoard />
    </div>
  );
}
