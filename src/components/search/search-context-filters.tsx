"use client";

import { useState } from "react";
import { SlidersHorizontal, X, Check, Building2, Car, MapPin, Sparkles, User, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { NIGERIAN_STATES } from "@/lib/constants";
import { getAllCitiesForState } from "@/constants/nigeriaAllCities";
import { VEHICLE_MAKES, VEHICLE_MAKE_TYPES } from "@/lib/marketplace/vehicle-makes";

export type FilterVertical = "all" | "property" | "vehicle" | "land" | "agent";

export function SearchContextFilters({
  activeVertical = "all",
  onApply,
  onClose,
}: {
  activeVertical?: FilterVertical;
  onApply: (filters: Record<string, string>) => void;
  onClose: () => void;
}) {
  const [vertical, setVertical] = useState<FilterVertical>(activeVertical);
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  // Property Filters
  const [propertyType, setPropertyType] = useState("");
  const [listingType, setListingType] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [propertyPriceMax, setPropertyPriceMax] = useState("250000000");

  // Vehicle Filters
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleCondition, setVehicleCondition] = useState("");
  const [vehiclePriceMax, setVehiclePriceMax] = useState("30000000");

  // Agent Filters
  const [agentRole, setAgentRole] = useState("");

  const cityOptions = selectedState ? getAllCitiesForState(selectedState) : [];
  const modelOptions = vehicleMake ? VEHICLE_MAKE_TYPES[vehicleMake] || [] : [];

  function handleReset() {
    setSelectedState("");
    setSelectedCity("");
    setPropertyType("");
    setListingType("");
    setBedrooms("");
    setPropertyPriceMax("250000000");
    setVehicleMake("");
    setVehicleModel("");
    setVehicleCondition("");
    setVehiclePriceMax("30000000");
    setAgentRole("");
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    const filters: Record<string, string> = {};

    if (vertical !== "all") filters.vertical = vertical;
    if (selectedState) filters.state = selectedState;
    if (selectedCity) filters.city = selectedCity;

    if (vertical === "property" || vertical === "all" || vertical === "land") {
      if (propertyType) filters.property_type = propertyType;
      if (listingType) filters.type = listingType;
      if (bedrooms) filters.beds = bedrooms;
      if (propertyPriceMax) filters.max = propertyPriceMax;
    }

    if (vertical === "vehicle") {
      if (vehicleMake) filters.make = vehicleMake;
      if (vehicleModel) filters.model = vehicleModel;
      if (vehicleCondition) filters.vehicle_condition = vehicleCondition;
      if (vehiclePriceMax) filters.max = vehiclePriceMax;
    }

    if (vertical === "agent") {
      if (agentRole) filters.role = agentRole;
    }

    onApply(filters);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-navy/70 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl bg-white dark:bg-navy text-navy dark:text-white shadow-2xl border border-navy/10 dark:border-white/10 animate-in slide-in-from-bottom-6 duration-200">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 px-5 py-4 bg-[#031B4E] text-white">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-gold" />
            <h2 className="text-base font-black">Smart Filter Engine</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white/80 hover:bg-white/20"
            >
              <RefreshCw className="h-3 w-3" />
              Reset
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* VERTICAL SELECTOR TABS */}
        <div className="flex border-b border-slate-100 dark:border-white/10 p-2 bg-slate-50 dark:bg-navy-light overflow-x-auto gap-1">
          {[
            { id: "all", label: "All Categories", icon: Sparkles },
            { id: "property", label: "Properties", icon: Building2 },
            { id: "vehicle", label: "Vehicles", icon: Car },
            { id: "land", label: "Land", icon: MapPin },
            { id: "agent", label: "Agents", icon: User },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = vertical === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setVertical(item.id as FilterVertical)}
                className={cn(
                  "pressable shrink-0 flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-xs font-bold transition-all",
                  isActive
                    ? "bg-[#031B4E] dark:bg-gold text-white dark:text-navy shadow-md"
                    : "text-navy/70 dark:text-white/70 hover:bg-slate-200 dark:hover:bg-white/10"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* FORM CONTENT */}
        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          
          {/* LOCATION FILTERS */}
          <div className="space-y-2">
            <h4 className="font-black uppercase tracking-wider text-navy/50 dark:text-white/50">
              Location Filter
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-navy/70 dark:text-white/70 block mb-1">State</label>
                <select
                  value={selectedState}
                  onChange={(e) => {
                    setSelectedState(e.target.value);
                    setSelectedCity("");
                  }}
                  className="w-full rounded-2xl border border-slate-200 dark:border-white/20 bg-white dark:bg-navy-light px-3 py-2.5 text-xs font-bold text-navy dark:text-white focus:ring-2 focus:ring-gold"
                >
                  <option value="">All Nigeria</option>
                  {NIGERIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-navy/70 dark:text-white/70 block mb-1">City / Area</label>
                <input
                  type="text"
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  placeholder="Lekki, Ikeja, Maitama..."
                  className="w-full rounded-2xl border border-slate-200 dark:border-white/20 bg-white dark:bg-navy-light px-3 py-2.5 text-xs font-bold text-navy dark:text-white focus:ring-2 focus:ring-gold"
                />
              </div>
            </div>
          </div>

          {/* PROPERTY FILTERS */}
          {(vertical === "property" || vertical === "all" || vertical === "land") && (
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-white/10">
              <h4 className="font-black uppercase tracking-wider text-navy/50 dark:text-white/50">
                Property Preferences
              </h4>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-navy/70 dark:text-white/70 block mb-1">Deal Type</label>
                  <select
                    value={listingType}
                    onChange={(e) => setListingType(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 dark:border-white/20 bg-white dark:bg-navy-light px-3 py-2.5 text-xs font-bold text-navy dark:text-white focus:ring-2 focus:ring-gold"
                  >
                    <option value="">Any Deal</option>
                    <option value="sale">For Sale</option>
                    <option value="rent">For Rent</option>
                    <option value="lease">Lease</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-navy/70 dark:text-white/70 block mb-1">Property Type</label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 dark:border-white/20 bg-white dark:bg-navy-light px-3 py-2.5 text-xs font-bold text-navy dark:text-white focus:ring-2 focus:ring-gold"
                  >
                    <option value="">All Types</option>
                    <option value="flat">Apartment / Flat</option>
                    <option value="duplex">Duplex</option>
                    <option value="terrace">Terrace</option>
                    <option value="bungalow">Bungalow</option>
                    <option value="land">Land Plot</option>
                    <option value="office">Commercial Office</option>
                    <option value="shop">Retail Shop</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-navy/70 dark:text-white/70 block mb-1">Bedrooms</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {["", "1", "2", "3", "4+"].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBedrooms(b)}
                      className={cn(
                        "py-2 rounded-xl text-xs font-bold border transition-all",
                        bedrooms === b
                          ? "bg-[#031B4E] dark:bg-gold text-white dark:text-navy border-[#031B4E] dark:border-gold"
                          : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10"
                      )}
                    >
                      {b ? `${b} Bed` : "Any"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VEHICLE FILTERS */}
          {(vertical === "vehicle" || vertical === "all") && (
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-white/10">
              <h4 className="font-black uppercase tracking-wider text-navy/50 dark:text-white/50">
                Automotive Specifications
              </h4>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-navy/70 dark:text-white/70 block mb-1">Vehicle Make</label>
                  <select
                    value={vehicleMake}
                    onChange={(e) => {
                      setVehicleMake(e.target.value);
                      setVehicleModel("");
                    }}
                    className="w-full rounded-2xl border border-slate-200 dark:border-white/20 bg-white dark:bg-navy-light px-3 py-2.5 text-xs font-bold text-navy dark:text-white focus:ring-2 focus:ring-gold"
                  >
                    <option value="">All Makes</option>
                    {VEHICLE_MAKES.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-navy/70 dark:text-white/70 block mb-1">Condition</label>
                  <select
                    value={vehicleCondition}
                    onChange={(e) => setVehicleCondition(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 dark:border-white/20 bg-white dark:bg-navy-light px-3 py-2.5 text-xs font-bold text-navy dark:text-white focus:ring-2 focus:ring-gold"
                  >
                    <option value="">All Conditions</option>
                    <option value="foreign_used">Tokunbo (Foreign Used)</option>
                    <option value="nigerian_used">Nigerian Used</option>
                    <option value="brand_new">Brand New</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* AGENT FILTERS */}
          {vertical === "agent" && (
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-white/10">
              <h4 className="font-black uppercase tracking-wider text-navy/50 dark:text-white/50">
                Partner & Agent Type
              </h4>
              <select
                value={agentRole}
                onChange={(e) => setAgentRole(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 dark:border-white/20 bg-white dark:bg-navy-light px-3 py-2.5 text-xs font-bold text-navy dark:text-white focus:ring-2 focus:ring-gold"
              >
                <option value="">All Verified Partners</option>
                <option value="agent">Real Estate Agents</option>
                <option value="dealer">Auto Dealerships</option>
                <option value="verifier">Field Property Verifiers</option>
                <option value="legal">Legal Verification Partners</option>
              </select>
            </div>
          )}

          {/* ACTION BUTTON */}
          <div className="pt-3 border-t border-slate-100 dark:border-white/10">
            <button
              type="submit"
              className="pressable w-full flex items-center justify-center gap-2 rounded-2xl bg-[#031B4E] dark:bg-gold py-3.5 text-xs font-black text-white dark:text-navy hover:bg-navy/90 shadow-md"
            >
              <Check className="h-4 w-4" />
              <span>APPLY FILTERS & SEARCH</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
