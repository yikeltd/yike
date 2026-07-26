import { AdminPageHeader } from "@/components/admin/dashboard/admin-ui";
import { MediaProtectionAssetsPanel } from "@/components/admin/media-protection-assets-panel";

export default function TechUploadsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Uploads & media protection"
        description="Listing media pipeline health and protected asset registry"
      />
      <p className="rounded-2xl border border-navy/10 bg-white p-6 text-sm text-muted">
        New listing photos run through the Enterprise Media Protection Pipeline (dynamic watermark,
        micro pattern, fingerprints, private original archive). Kill switch:{" "}
        <code className="text-xs">ENABLE_MEDIA_PROTECTION</code>. Architecture:{" "}
        <code className="text-xs">docs/media/MEDIA_PROTECTION_ARCHITECTURE.md</code>.
      </p>
      <MediaProtectionAssetsPanel />
      <p className="rounded-2xl border border-navy/10 bg-white p-6 text-sm text-muted">
        No separate failed-upload queue yet. Check Coolify logs for{" "}
        <code className="text-xs">[media/upload]</code> errors.
      </p>
    </div>
  );
}
