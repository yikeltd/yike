"use client";

import { useState } from "react";
import type { PartnerProfile } from "@/types/partner-platform";
import { Users, ShieldCheck, Star, CheckCircle2 } from "lucide-react";

export function PartnerDirectoryCard() {
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("all");

  const partners: PartnerProfile[] = [
    {
      id: "ptr_901_ng",
      name: "Apex Property Inspection Ltd",
      email: "dispatch@apexinspections.ng",
      phone: "+2348039012301",
      discipline: "property_inspector",
      licenseNumber: "ESVARBON/2024/9012",
      regulatoryBody: "Estate Surveyors & Valuers Registration Board",
      complianceTier: "TIER_3_GOVT_CERTIFIED",
      rating: 4.95,
      totalDispatches: 412,
      onTimeSlaPercent: 99.2,
      activeJobs: 3,
      geoFenceRegion: "Lagos",
      insuranceValidUntil: "2027-12-31",
      taxIdNumber: "TIN-NG-8890124",
      bankDetails: { bankName: "Guaranty Trust Bank", accountNumber: "0123456789", accountName: "Apex Inspections NG" },
      status: "active",
    },
    {
      id: "ptr_902_ng",
      name: "Stankings Advocates & Legal Partners",
      email: "legal@stankingslaw.ng",
      phone: "+2348021122334",
      discipline: "legal_partner",
      licenseNumber: "NBA/SAN/2018/4412",
      regulatoryBody: "Nigerian Bar Association (NBA)",
      complianceTier: "TIER_3_GOVT_CERTIFIED",
      rating: 4.98,
      totalDispatches: 289,
      onTimeSlaPercent: 98.8,
      activeJobs: 2,
      geoFenceRegion: "Abuja",
      insuranceValidUntil: "2028-06-30",
      taxIdNumber: "TIN-NG-4401928",
      bankDetails: { bankName: "Zenith Bank", accountNumber: "1098765432", accountName: "Stankings Legal LP" },
      status: "active",
    },
    {
      id: "ptr_903_gh",
      name: "Accra AutoMechanics & OBD Diagnostics",
      email: "service@accraautomech.gh",
      phone: "+233241234567",
      discipline: "vehicle_inspector",
      licenseNumber: "GRA/AUTO/2025/1109",
      regulatoryBody: "Ghana Driver & Vehicle Licensing Authority",
      complianceTier: "TIER_2_ENTERPRISE",
      rating: 4.88,
      totalDispatches: 156,
      onTimeSlaPercent: 97.4,
      activeJobs: 1,
      geoFenceRegion: "Accra",
      insuranceValidUntil: "2027-08-31",
      taxIdNumber: "TIN-GH-9912041",
      bankDetails: { bankName: "GCB Bank", accountNumber: "2019283746", accountName: "Accra AutoMech GH" },
      status: "active",
    },
    {
      id: "ptr_904_ke",
      name: "Nairobi Cadastral & Land Surveyors",
      email: "survey@nairobilands.co.ke",
      phone: "+254712345678",
      discipline: "land_surveyor",
      licenseNumber: "LSK/SURV/2023/8821",
      regulatoryBody: "Institution of Surveyors of Kenya (ISK)",
      complianceTier: "TIER_3_GOVT_CERTIFIED",
      rating: 4.92,
      totalDispatches: 204,
      onTimeSlaPercent: 98.1,
      activeJobs: 4,
      geoFenceRegion: "Nairobi",
      insuranceValidUntil: "2027-11-30",
      taxIdNumber: "KRA-PIN-A009182374Z",
      bankDetails: { bankName: "KCB Bank", accountNumber: "1122334455", accountName: "Nairobi Surveyors KE" },
      status: "active",
    },
  ];

  const filteredPartners = selectedDiscipline === "all"
    ? partners
    : partners.filter((p) => p.discipline === selectedDiscipline);

  return (
    <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-6 shadow-xl space-y-6 text-xs select-none">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/10 pb-4">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-navy dark:text-white flex items-center gap-2">
            <Users className="h-4 w-4 text-gold" />
            Multi-Discipline Certified Partner Directory
          </h2>
          <p className="text-[11px] text-navy/60 dark:text-white/60 mt-0.5">
            Verified Property Auditors, Legal Advocates, Automotive Mechanics, and Land Surveyors across Africa.
          </p>
        </div>

        {/* DISCIPLINE FILTER */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {["all", "property_inspector", "legal_partner", "vehicle_inspector", "land_surveyor"].map((disc) => (
            <button
              key={disc}
              type="button"
              onClick={() => setSelectedDiscipline(disc)}
              className={`px-3 py-1 rounded-xl text-[10px] font-mono font-bold capitalize transition-all shrink-0 ${
                selectedDiscipline === disc
                  ? "bg-[#031B4E] dark:bg-gold text-white dark:text-navy font-black shadow-sm"
                  : "bg-slate-100 dark:bg-white/10 text-navy/70 dark:text-white/70 hover:bg-slate-200"
              }`}
            >
              {disc.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* PARTNERS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPartners.map((ptr) => (
          <div
            key={ptr.id}
            className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-3 shadow-sm flex flex-col justify-between"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-navy/50 dark:text-white/50">{ptr.id}</span>
                <span className="rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[9px] font-black uppercase font-mono">
                  {ptr.complianceTier.replace(/_/g, " ")}
                </span>
              </div>

              <h3 className="font-black text-xs text-navy dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                {ptr.name}
              </h3>

              <p className="text-[11px] text-navy/60 dark:text-white/60">
                License: <code className="font-mono font-bold text-navy dark:text-white">{ptr.licenseNumber}</code> ({ptr.regulatoryBody})
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-white/10 grid grid-cols-3 gap-2 font-mono text-[10px]">
              <div className="space-y-0.5">
                <span className="text-navy/40 dark:text-white/40 uppercase">Rating</span>
                <p className="font-black text-gold flex items-center gap-0.5">
                  <Star className="h-3 w-3 fill-gold text-gold" /> {ptr.rating} / 5.0
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-navy/40 dark:text-white/40 uppercase">Dispatches</span>
                <p className="font-bold text-navy dark:text-white">{ptr.totalDispatches} Total</p>
              </div>

              <div className="space-y-0.5">
                <span className="text-navy/40 dark:text-white/40 uppercase">SLA Rate</span>
                <p className="font-bold text-emerald-500 flex items-center gap-0.5">
                  <CheckCircle2 className="h-3 w-3" /> {ptr.onTimeSlaPercent}%
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
