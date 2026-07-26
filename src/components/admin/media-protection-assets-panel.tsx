"use client";

import { useEffect, useState } from "react";

type MediaAssetRow = {
  id: string;
  image_uuid: string;
  owner_id: string;
  listing_id: string | null;
  listing_ref: string;
  seller_name: string | null;
  company_name: string | null;
  watermark_label: string;
  created_at: string;
  sha256: string;
  phash: string;
  dhash: string;
  ahash: string;
  original_width: number | null;
  original_height: number | null;
  watermark_version: string;
  pipeline_version: string;
  path_large: string | null;
  protection_enabled: boolean;
};

export function MediaProtectionAssetsPanel() {
  const [assets, setAssets] = useState<MediaAssetRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/media/assets?limit=30", {
          credentials: "same-origin",
        });
        const json = (await res.json().catch(() => ({}))) as {
          assets?: MediaAssetRow[];
          error?: string;
        };
        if (!res.ok) {
          if (!cancelled) setError(json.error ?? "Could not load media assets");
          return;
        }
        if (!cancelled) setAssets(json.assets ?? []);
      } catch {
        if (!cancelled) setError("Could not load media assets");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-4 rounded-2xl border border-navy/10 bg-white p-6">
      <div>
        <h2 className="text-base font-semibold text-navy">Media protection registry</h2>
        <p className="mt-1 text-sm text-muted">
          Fingerprints and watermark metadata for newly protected listing photos. Originals stay in
          the private archive bucket.
        </p>
      </div>

      {loading && <p className="text-sm text-muted">Loading…</p>}
      {error && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          {error}
        </p>
      )}
      {!loading && !error && assets.length === 0 && (
        <p className="text-sm text-muted">No protected assets yet. New listing uploads will appear here.</p>
      )}

      {assets.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="border-b border-navy/10 text-muted">
              <tr>
                <th className="py-2 pr-3 font-medium">Created</th>
                <th className="py-2 pr-3 font-medium">Watermark</th>
                <th className="py-2 pr-3 font-medium">Listing</th>
                <th className="py-2 pr-3 font-medium">Size</th>
                <th className="py-2 pr-3 font-medium">pHash</th>
                <th className="py-2 pr-3 font-medium">Pipeline</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((row) => (
                <tr key={row.id} className="border-b border-navy/5 align-top text-navy">
                  <td className="py-2 pr-3 whitespace-nowrap">
                    {new Date(row.created_at).toLocaleString()}
                  </td>
                  <td className="py-2 pr-3 max-w-[180px] truncate" title={row.watermark_label}>
                    {row.watermark_label}
                  </td>
                  <td className="py-2 pr-3 font-mono text-[10px] max-w-[140px] truncate">
                    {row.listing_id ?? row.listing_ref}
                  </td>
                  <td className="py-2 pr-3 whitespace-nowrap">
                    {row.original_width ?? "—"}×{row.original_height ?? "—"}
                  </td>
                  <td className="py-2 pr-3 font-mono text-[10px]">{row.phash.slice(0, 12)}…</td>
                  <td className="py-2 pr-3 whitespace-nowrap">
                    {row.pipeline_version} / wm {row.watermark_version}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
