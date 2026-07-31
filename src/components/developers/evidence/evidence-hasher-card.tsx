"use client";

import { useState } from "react";
import type { EvidenceItem } from "@/types/evidence";
import { verifyEvidenceHash } from "@/lib/evidence/vault-engine";
import { ShieldCheck, MapPin, Camera, Play, AlertTriangle } from "lucide-react";

export function EvidenceHasherCard() {
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([
    {
      id: "evd_901",
      passportId: "px_8819024_ng",
      partnerId: "ptr_901_ng",
      type: "photo",
      title: "Structural Foundation Audit High-Res Capture",
      s3UriPrimary: "s3://yike-evidence-los-01/px_8819024/evd_901.jpg",
      s3UriBackup: "s3://yike-evidence-lhr-01/px_8819024/evd_901.jpg",
      sha256Hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      hashStatus: "VERIFIED_INTACT",
      exif: { latitude: 6.4549, longitude: 3.4246, altitude: 12.4, deviceModel: "iPhone 15 Pro Max", capturedAt: "2026-07-31T06:10:00.000Z" },
      version: 1,
      createdAt: "2026-07-31T06:12:00.000Z",
    },
    {
      id: "evd_902",
      passportId: "px_8819024_ng",
      partnerId: "ptr_902_ng",
      type: "title_deed",
      title: "Governor's Consent & Land Registry Clearance Deed",
      s3UriPrimary: "s3://yike-evidence-los-01/px_8819024/evd_902.pdf",
      s3UriBackup: "s3://yike-evidence-lhr-01/px_8819024/evd_902.pdf",
      sha256Hash: "a495991b7852b855e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934c",
      hashStatus: "VERIFIED_INTACT",
      exif: { latitude: 9.0765, longitude: 7.3986, deviceModel: "Fujitsu ScanSnap iX1600", capturedAt: "2026-07-31T05:30:00.000Z" },
      version: 1,
      createdAt: "2026-07-31T05:45:00.000Z",
    },
  ]);

  const [verificationResult, setVerificationResult] = useState<string | null>(null);

  const simulateHashVerification = (item: EvidenceItem, alterHash = false) => {
    const testHash = alterHash ? "tampered_fake_hash_12345" : item.sha256Hash;
    const status = verifyEvidenceHash(testHash, item.sha256Hash);

    setEvidenceList((prev) =>
      prev.map((e) => (e.id === item.id ? { ...e, hashStatus: status } : e))
    );

    if (status === "VERIFIED_INTACT") {
      setVerificationResult(`Integrity Verified: ${item.id} SHA-256 hash matches S3 Object Lock digest (${item.sha256Hash.slice(0, 16)}...)`);
    } else {
      setVerificationResult(`⚠️ TAMPER DETECTED: Hash mismatch for ${item.id}! File corrupted or modified after upload.`);
    }
  };

  return (
    <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-6 shadow-xl space-y-6 text-xs select-none">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/10 pb-4">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-navy dark:text-white flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Dual-Layer SHA-256 Hashing & EXIF Metadata Inspector
          </h2>
          <p className="text-[11px] text-navy/60 dark:text-white/60 mt-0.5">
            Tamper-proof evidence verification pipeline enforcing cryptographic integrity and EXIF GPS location metadata.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2 text-xs font-black text-emerald-600 dark:text-emerald-400 shrink-0">
          <ShieldCheck className="h-4 w-4" />
          <span>CRYPTOGRAPHY INTACT</span>
        </div>
      </div>

      {verificationResult && (
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-mono text-[10px] font-bold">
          {verificationResult}
        </div>
      )}

      {/* EVIDENCE ITEMS CARDS */}
      <div className="space-y-4 font-mono text-[11px]">
        {evidenceList.map((item) => {
          const isTampered = item.hashStatus === "TAMPERED_HASH_MISMATCH";

          return (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-start justify-between gap-4 shadow-sm ${
                isTampered
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300"
                  : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-black text-xs text-navy dark:text-white">
                  <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>{item.title}</span>
                  <span className="rounded-full bg-gold/20 text-gold px-2 py-0.2 text-[9px] uppercase">{item.type}</span>
                </div>

                <div className="space-y-1 text-[10px] text-navy/60 dark:text-white/60">
                  <p>SHA-256 Digest: <code className="font-bold text-navy dark:text-white">{item.sha256Hash}</code></p>
                  <p>Primary S3: <code className="text-gold">{item.s3UriPrimary}</code></p>
                  {item.exif && (
                    <p className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                      <MapPin className="h-3 w-3" /> GPS: {item.exif.latitude}, {item.exif.longitude} (Alt: {item.exif.altitude || 0}m) · <Camera className="h-3 w-3" /> {item.exif.deviceModel}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => simulateHashVerification(item, false)}
                  className="pressable rounded-xl bg-slate-100 dark:bg-white/10 text-navy dark:text-white px-3 py-1 font-bold text-[10px] uppercase flex items-center gap-1"
                >
                  <Play className="h-3 w-3 text-emerald-500" /> Verify Hash
                </button>

                <button
                  type="button"
                  onClick={() => simulateHashVerification(item, true)}
                  className="pressable rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 px-3 py-1 font-bold text-[10px] uppercase flex items-center gap-1"
                >
                  <AlertTriangle className="h-3 w-3" /> Simulate Tamper
                </button>

                <span
                  className={`rounded-full px-2.5 py-0.5 font-black uppercase text-[9px] ${
                    isTampered
                      ? "bg-rose-500 text-white"
                      : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {item.hashStatus.replace(/_/g, " ")}
                </span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
