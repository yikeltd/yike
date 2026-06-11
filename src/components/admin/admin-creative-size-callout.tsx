import type { AdminCreativeSpec } from "@/constants/adminCreativeSpecs";
import { ADMIN_UPLOAD_FORMAT } from "@/constants/adminCreativeSpecs";

export function AdminCreativeSizeCallout({ spec }: { spec: AdminCreativeSpec }) {
  return (
    <div className="rounded-xl border border-gold/30 bg-gold/5 px-3 py-2.5 text-xs text-navy">
      <p className="font-bold text-navy">
        Design size: {spec.designSize}
        <span className="font-semibold text-muted"> · {spec.aspectRatio}</span>
      </p>
      {spec.displaySize ? (
        <p className="mt-0.5 text-muted">On screen: {spec.displaySize}</p>
      ) : null}
      <p className="mt-0.5 text-muted">{spec.format ?? ADMIN_UPLOAD_FORMAT}</p>
      {spec.notes ? (
        <p className="mt-1 text-[11px] leading-snug text-muted">{spec.notes}</p>
      ) : null}
    </div>
  );
}
