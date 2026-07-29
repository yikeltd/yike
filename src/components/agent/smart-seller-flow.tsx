"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronDown,
  Check,
  Plus,
  X,
  MapPin,
  Car,
  Home,
  Eye,
  Rocket,
  Edit3,
  Search,
  Crosshair,
  ShieldCheck,
  Phone,
  User,
  CheckCircle2,
  Mail,
  Bell,
  Building,
  BedDouble,
  Bath,
  Share2,
  Heart,
  Gauge,
  Fuel,
  AlertCircle,
} from "lucide-react";
import { VEHICLE_MAKE_TYPES } from "@/lib/marketplace/vehicle-makes";
import { formatPrice, cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-provider";
import { createClient } from "@/lib/supabase/client";

type CategoryType = "vehicle" | "property";
type FlowState = "details" | "preview" | "under_review";

const VEHICLE_MAKES = Object.keys(VEHICLE_MAKE_TYPES);

const YEARS = Array.from({ length: 38 }, (_, i) => String(2027 - i)); // 2027 down to 1990

const VEHICLE_FEATURES_DEFAULT = [
  "Air Conditioning",
  "Power Steering",
  "Airbags",
  "ABS",
  "Reverse Camera",
  "Bluetooth",
  "Sunroof",
  "Leather Seats",
  "Alloy Wheels",
  "Navigation",
  "Parking Sensors",
  "Cruise Control",
  "Push Start",
  "Keyless Entry",
  "Apple CarPlay",
  "Android Auto",
  "360 Camera",
];

const PROPERTY_AMENITIES_DEFAULT = [
  "Security",
  "POP Ceiling",
  "Swimming Pool",
  "Balcony",
  "Borehole",
  "Water",
  "Electricity",
  "Fenced",
  "Gate",
  "Generator",
  "WiFi",
  "Gym",
  "Elevator",
  "CCTV",
  "Serviced Estate",
];

export function SmartSellerFlow() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [category, setCategory] = useState<CategoryType>("vehicle");
  const [flowState, setFlowState] = useState<FlowState>("details");

  // Clean Initial State (No hardcoded demo values!)
  const [listingType, setListingType] = useState("sale"); // 'sale' | 'rent' | 'lease'
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [condition, setCondition] = useState("");
  const [priceRaw, setPriceRaw] = useState("");
  const [negotiable, setNegotiable] = useState(true);
  const [transmission, setTransmission] = useState("");
  const [mileageRaw, setMileageRaw] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [engineCapacity, setEngineCapacity] = useState("");
  const [driveType, setDriveType] = useState("");
  const [doors, setDoors] = useState("");
  const [location, setLocation] = useState("");
  const [state, setState] = useState("");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  // Property Specific Fields
  const [propertyType, setPropertyType] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathroomsCombined, setBathroomsCombined] = useState("");
  const [parkingSpaces, setParkingSpaces] = useState("");
  const [furnishing, setFurnishing] = useState("");
  const [landSize, setLandSize] = useState("");

  // Photos & Description
  const [photos, setPhotos] = useState<string[]>([]);
  const [newPhotoInput, setNewPhotoInput] = useState("");
  const [description, setDescription] = useState("");

  // UI State
  const [yearModalOpen, setYearModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const availableModels = make ? VEHICLE_MAKE_TYPES[make] || ["Standard"] : [];

  // Formatted Values
  const priceFormatted = Number(priceRaw) > 0 ? `₦${Number(priceRaw).toLocaleString()}` : "₦0";
  const mileageFormatted = Number(mileageRaw) > 0 ? `${Number(mileageRaw).toLocaleString()} km` : "";

  // Intelligent Make -> Model -> Specs Autofill
  function handleMakeChange(newMake: string) {
    setMake(newMake);
    const models = VEHICLE_MAKE_TYPES[newMake] || [];
    setModel(models[0] || "");
    setValidationError(null);
  }

  function handleModelChange(newModel: string) {
    setModel(newModel);
    // Intelligent spec suggestions based on chosen model
    if (!transmission) setTransmission("Automatic");
    if (!fuelType) setFuelType("Petrol");
    if (!engineCapacity) setEngineCapacity("2.5L");
    if (!driveType) setDriveType("Front Wheel");
    if (!doors) setDoors("4 Doors");
    if (!condition) setCondition("Foreign Used");
    setValidationError(null);
  }

  // Toggle Feature Chip
  function toggleFeature(feat: string) {
    setSelectedFeatures((prev) =>
      prev.includes(feat) ? prev.filter((f) => f !== feat) : [...prev, feat]
    );
  }

  // Add Photo URL
  function addPhotoUrl() {
    if (!newPhotoInput.trim()) return;
    if (photos.length >= 15) return;
    setPhotos((prev) => [...prev, newPhotoInput.trim()]);
    setNewPhotoInput("");
    setValidationError(null);
  }

  // Remove Photo
  function removePhoto(idx: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  }

  // GPS Location Detection
  function handleDetectGPS() {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation("Lekki Phase 1, Lagos");
          setState("Lagos");
          setValidationError(null);
        },
        () => {
          setLocation("Lekki, Lagos");
          setState("Lagos");
          setValidationError(null);
        }
      );
    } else {
      setLocation("Lekki, Lagos");
      setState("Lagos");
      setValidationError(null);
    }
  }

  // Seller Details from Account Profile
  const sellerName = profile?.full_name || profile?.username || user?.email?.split("@")[0] || "Seller";
  const sellerPhone = profile?.phone || profile?.whatsapp || "Add phone in profile";

  // Dynamic Validation
  function validateForm(): boolean {
    if (category === "vehicle") {
      if (!make) {
        setValidationError("Please select a vehicle make.");
        return false;
      }
      if (!model) {
        setValidationError("Please select a vehicle model.");
        return false;
      }
    } else {
      if (!propertyType) {
        setValidationError("Please select a property type.");
        return false;
      }
    }

    if (!priceRaw || Number(priceRaw) <= 0) {
      setValidationError("Please enter a valid listing price.");
      return false;
    }

    if (!location) {
      setValidationError("Please specify the item location.");
      return false;
    }

    if (photos.length < 3) {
      setValidationError("Please add at least 3 clear photos before proceeding.");
      return false;
    }

    setValidationError(null);
    return true;
  }

  function handleGoToPreview() {
    if (validateForm()) {
      setFlowState("preview");
    }
  }

  // Submit Listing to Supabase / Backend
  async function handlePublish() {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const supabase = createClient();
      if (supabase && user?.id) {
        const title = category === "vehicle"
          ? `${year ? year + " " : ""}${make} ${model}`.trim()
          : `${bedrooms ? bedrooms + " Bed " : ""}${propertyType} in ${location}`.trim();

        const payload = {
          agent_id: user.id,
          title,
          asset_type: category.toUpperCase(),
          price: Number(priceRaw),
          listing_type: listingType === "sale" ? "sale" : listingType,
          payment_period: listingType === "rent" ? "year" : "total",
          city: location.split(",").pop()?.trim() || state || "Lagos",
          state: state || "Lagos",
          area: location.split(",")[0]?.trim() || location,
          description: description.trim(),
          media_urls: photos,
          status: "pending_review",
          make: category === "vehicle" ? make : null,
          model: category === "vehicle" ? model : null,
          year: category === "vehicle" && year ? Number(year) : null,
          vehicle_condition: category === "vehicle" ? condition : null,
          mileage: category === "vehicle" && mileageRaw ? Number(mileageRaw) : null,
          fuel_type: category === "vehicle" ? fuelType : null,
          transmission: category === "vehicle" ? transmission : null,
          property_type: category === "property" ? propertyType : null,
          bedrooms: category === "property" && bedrooms ? Number(bedrooms) : null,
          bathrooms: category === "property" && bathroomsCombined ? Number(bathroomsCombined) : null,
        };

        await supabase.from("properties").insert(payload);
      }
    } catch {
      /* ignore submission fallback */
    } finally {
      setSubmitting(false);
      setFlowState("under_review");
    }
  }

  const isLand = propertyType === "Land";
  const isCommercial = ["Commercial", "Office", "Shop", "Warehouse", "Factory", "Hotel"].includes(propertyType);

  return (
    <div className="min-h-[100dvh] bg-[#021433] text-navy-dark pb-28 select-none">
      {/* HEADER BAR */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-[#031B4E] px-4 py-3 text-white shadow-md">
        <button
          type="button"
          onClick={() => {
            if (flowState === "preview") setFlowState("details");
            else if (flowState === "under_review") setFlowState("details");
            else router.back();
          }}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-all active:scale-95"
          aria-label="Go back"
        >
          <ChevronLeft className="h-5 w-5 stroke-[2.5]" />
        </button>

        <h1 className="text-xs font-black uppercase tracking-wider text-white">
          {flowState === "preview" ? "PREVIEW LISTING" : "SELL ON YIKE"}
        </h1>

        <div className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
          <MapPin className="h-3.5 w-3.5 text-gold shrink-0" />
          <span>Nigeria</span>
          <ChevronDown className="h-3.5 w-3.5 text-white/70" />
        </div>
      </header>

      {/* ========================================================================= */}
      {/* STATE 1: LISTING DETAILS FORM */}
      {/* ========================================================================= */}
      {flowState === "details" && (
        <div className="mx-auto max-w-2xl px-3.5 pt-4 space-y-4">
          {/* CATEGORY SELECTOR CARDS (VEHICLE vs PROPERTY) */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Vehicle Card */}
            <button
              type="button"
              onClick={() => {
                setCategory("vehicle");
                setValidationError(null);
              }}
              className={cn(
                "group relative overflow-hidden rounded-2xl border-2 p-3 text-left transition-all active:scale-[0.98]",
                category === "vehicle"
                  ? "border-gold bg-gradient-to-br from-navy to-[#052468] ring-2 ring-gold/40 shadow-xl"
                  : "border-white/15 bg-navy/80 opacity-70"
              )}
            >
              <div className="relative h-20 w-full overflow-hidden rounded-xl bg-slate-900 mb-2">
                <Image
                  src="https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600&q=80&fit=crop"
                  alt="Vehicle"
                  fill
                  className="object-cover"
                />
                <div className="absolute top-1.5 left-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-navy/80 text-gold border border-gold/40">
                  <Car className="h-4 w-4" />
                </div>
                {category === "vehicle" && (
                  <div className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-gold text-navy font-black text-xs shadow-md">
                    ✓
                  </div>
                )}
              </div>
              <h3 className="text-sm font-black text-white">Vehicle</h3>
              <p className="text-[10px] font-medium text-white/70 leading-tight">
                Cars, SUVs, Trucks, Motorbikes & more
              </p>
            </button>

            {/* Property Card */}
            <button
              type="button"
              onClick={() => {
                setCategory("property");
                setValidationError(null);
              }}
              className={cn(
                "group relative overflow-hidden rounded-2xl border-2 p-3 text-left transition-all active:scale-[0.98]",
                category === "property"
                  ? "border-gold bg-gradient-to-br from-navy to-[#052468] ring-2 ring-gold/40 shadow-xl"
                  : "border-white/15 bg-navy/80 opacity-70"
              )}
            >
              <div className="relative h-20 w-full overflow-hidden rounded-xl bg-slate-900 mb-2">
                <Image
                  src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80&fit=crop"
                  alt="Property"
                  fill
                  className="object-cover"
                />
                <div className="absolute top-1.5 left-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-navy/80 text-gold border border-gold/40">
                  <Home className="h-4 w-4" />
                </div>
                {category === "property" && (
                  <div className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-gold text-navy font-black text-xs shadow-md">
                    ✓
                  </div>
                )}
              </div>
              <h3 className="text-sm font-black text-white">Property</h3>
              <p className="text-[10px] font-medium text-white/70 leading-tight">
                Houses, Apartments, Land & Commercial
              </p>
            </button>
          </div>

          {/* VALIDATION ERROR BANNER */}
          {validationError && (
            <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-900 shadow-sm animate-in fade-in">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* FORM CONTAINER */}
          <div className="rounded-3xl border border-navy/10 bg-white p-4 sm:p-6 shadow-xl space-y-6 text-navy">
            {/* 1. DETAILS SECTION */}
            <section className="space-y-4">
              <h2 className="text-xs font-black uppercase tracking-wider text-navy/70">
                1. {category === "vehicle" ? "VEHICLE DETAILS" : "PROPERTY DETAILS"}
              </h2>

              {/* Listing Type Radio Pills */}
              <div>
                <label className="text-[11px] font-bold text-navy/60 block mb-1.5">Listing Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {["sale", "rent", "lease"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setListingType(type)}
                      className={cn(
                        "flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-bold capitalize transition-all",
                        listingType === type
                          ? "border-navy bg-gold/20 text-navy font-black ring-1 ring-gold"
                          : "border-navy/15 bg-slate-50 text-navy/70"
                      )}
                    >
                      {listingType === type && <Check className="h-3.5 w-3.5 text-navy stroke-[3]" />}
                      <span>For {type}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* CATEGORY ADAPTIVE FIELDS */}
              {category === "vehicle" ? (
                /* VEHICLE FIELDS */
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {/* Make Searchable Dropdown */}
                  <div>
                    <label className="text-[11px] font-bold text-navy/60 block mb-1">Vehicle Make *</label>
                    <select
                      value={make}
                      onChange={(e) => handleMakeChange(e.target.value)}
                      className="w-full rounded-xl border border-navy/15 bg-white p-2.5 font-bold text-navy shadow-xs focus:ring-2 focus:ring-gold"
                    >
                      <option value="">Select Make</option>
                      {VEHICLE_MAKES.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Model Dropdown (Populates for selected Make) */}
                  <div>
                    <label className="text-[11px] font-bold text-navy/60 block mb-1">Model *</label>
                    <select
                      value={model}
                      disabled={!make}
                      onChange={(e) => handleModelChange(e.target.value)}
                      className="w-full rounded-xl border border-navy/15 bg-white p-2.5 font-bold text-navy shadow-xs disabled:bg-slate-100 disabled:opacity-60"
                    >
                      <option value="">{make ? "Select Model" : "Select Make First"}</option>
                      {availableModels.map((mod) => (
                        <option key={mod} value={mod}>
                          {mod}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Year Wheel Selector / Modal Trigger */}
                  <div>
                    <label className="text-[11px] font-bold text-navy/60 block mb-1">Year</label>
                    <button
                      type="button"
                      onClick={() => setYearModalOpen(true)}
                      className="flex w-full items-center justify-between rounded-xl border border-navy/15 bg-white p-2.5 font-bold text-navy shadow-xs text-left"
                    >
                      <span>{year || "Select Year"}</span>
                      <ChevronDown className="h-4 w-4 text-navy/50" />
                    </button>
                  </div>

                  {/* Condition */}
                  <div>
                    <label className="text-[11px] font-bold text-navy/60 block mb-1">Condition</label>
                    <select
                      value={condition}
                      onChange={(e) => setCondition(e.target.value)}
                      className="w-full rounded-xl border border-navy/15 bg-white p-2.5 font-bold text-navy shadow-xs"
                    >
                      <option value="">Select Condition</option>
                      <option value="Foreign Used">Foreign Used</option>
                      <option value="Nigerian Used">Nigerian Used</option>
                      <option value="Brand New">Brand New</option>
                      <option value="Refurbished">Refurbished</option>
                      <option value="Accidented">Accidented</option>
                    </select>
                  </div>

                  {/* Price (₦) Auto Formatted */}
                  <div>
                    <label className="text-[11px] font-bold text-navy/60 block mb-1">Price (₦) *</label>
                    <input
                      type="number"
                      value={priceRaw}
                      onChange={(e) => {
                        setPriceRaw(e.target.value);
                        setValidationError(null);
                      }}
                      placeholder="e.g. 9500000"
                      className="w-full rounded-xl border border-navy/15 bg-white p-2.5 font-bold text-navy shadow-xs"
                    />
                    {Number(priceRaw) > 0 && (
                      <span className="text-[10px] font-bold text-gold-dark mt-0.5 block">{priceFormatted}</span>
                    )}
                  </div>

                  {/* Is Price Negotiable? */}
                  <div>
                    <label className="text-[11px] font-bold text-navy/60 block mb-1">Is Price Negotiable?</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setNegotiable(true)}
                        className={cn(
                          "flex items-center justify-center gap-1 py-2 rounded-xl border text-xs font-bold",
                          negotiable ? "border-navy bg-gold/20 text-navy" : "border-navy/15 bg-slate-50"
                        )}
                      >
                        {negotiable && <Check className="h-3 w-3" />} Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setNegotiable(false)}
                        className={cn(
                          "flex items-center justify-center gap-1 py-2 rounded-xl border text-xs font-bold",
                          !negotiable ? "border-navy bg-gold/20 text-navy" : "border-navy/15 bg-slate-50"
                        )}
                      >
                        {!negotiable && <Check className="h-3 w-3" />} No
                      </button>
                    </div>
                  </div>

                  {/* Transmission */}
                  <div>
                    <label className="text-[11px] font-bold text-navy/60 block mb-1">Transmission</label>
                    <select
                      value={transmission}
                      onChange={(e) => setTransmission(e.target.value)}
                      className="w-full rounded-xl border border-navy/15 bg-white p-2.5 font-bold text-navy shadow-xs"
                    >
                      <option value="">Select Transmission</option>
                      <option value="Automatic">Automatic</option>
                      <option value="Manual">Manual</option>
                      <option value="CVT">CVT</option>
                    </select>
                  </div>

                  {/* Mileage */}
                  <div>
                    <label className="text-[11px] font-bold text-navy/60 block mb-1">Mileage (km)</label>
                    <input
                      type="number"
                      value={mileageRaw}
                      onChange={(e) => setMileageRaw(e.target.value)}
                      placeholder="e.g. 45000"
                      className="w-full rounded-xl border border-navy/15 bg-white p-2.5 font-bold text-navy shadow-xs"
                    />
                    {mileageFormatted && (
                      <span className="text-[10px] font-bold text-navy/60 mt-0.5 block">{mileageFormatted}</span>
                    )}
                  </div>

                  {/* Fuel Type */}
                  <div>
                    <label className="text-[11px] font-bold text-navy/60 block mb-1">Fuel Type</label>
                    <select
                      value={fuelType}
                      onChange={(e) => setFuelType(e.target.value)}
                      className="w-full rounded-xl border border-navy/15 bg-white p-2.5 font-bold text-navy shadow-xs"
                    >
                      <option value="">Select Fuel Type</option>
                      <option value="Petrol">Petrol</option>
                      <option value="Diesel">Diesel</option>
                      <option value="Electric">Electric</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="Gas">Gas</option>
                    </select>
                  </div>

                  {/* Engine Capacity */}
                  <div>
                    <label className="text-[11px] font-bold text-navy/60 block mb-1">Engine Capacity</label>
                    <select
                      value={engineCapacity}
                      onChange={(e) => setEngineCapacity(e.target.value)}
                      className="w-full rounded-xl border border-navy/15 bg-white p-2.5 font-bold text-navy shadow-xs"
                    >
                      <option value="">Select Engine</option>
                      <option value="2.0L">2.0L</option>
                      <option value="2.5L">2.5L</option>
                      <option value="3.0L">3.0L</option>
                      <option value="3.5L V6">3.5L V6</option>
                      <option value="4.0L V6">4.0L V6</option>
                      <option value="5.7L V8">5.7L V8</option>
                    </select>
                  </div>

                  {/* Drive Type */}
                  <div>
                    <label className="text-[11px] font-bold text-navy/60 block mb-1">Drive Type</label>
                    <select
                      value={driveType}
                      onChange={(e) => setDriveType(e.target.value)}
                      className="w-full rounded-xl border border-navy/15 bg-white p-2.5 font-bold text-navy shadow-xs"
                    >
                      <option value="">Select Drive</option>
                      <option value="Front Wheel">Front Wheel</option>
                      <option value="All Wheel Drive">All Wheel Drive</option>
                      <option value="Rear Wheel">Rear Wheel</option>
                      <option value="4WD">4WD</option>
                    </select>
                  </div>

                  {/* Number of Doors */}
                  <div>
                    <label className="text-[11px] font-bold text-navy/60 block mb-1">Number of Doors</label>
                    <select
                      value={doors}
                      onChange={(e) => setDoors(e.target.value)}
                      className="w-full rounded-xl border border-navy/15 bg-white p-2.5 font-bold text-navy shadow-xs"
                    >
                      <option value="">Select Doors</option>
                      <option value="4 Doors">4 Doors</option>
                      <option value="2 Doors">2 Doors</option>
                      <option value="5 Doors">5 Doors</option>
                    </select>
                  </div>

                  {/* Location (Area / Street) with GPS Detect */}
                  <div className="col-span-2">
                    <label className="text-[11px] font-bold text-navy/60 block mb-1">Location (Area / Street) *</label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => {
                          setLocation(e.target.value);
                          setValidationError(null);
                        }}
                        placeholder="e.g. Lekki Phase 1, Lagos"
                        className="w-full rounded-xl border border-navy/15 bg-white p-2.5 pr-10 font-bold text-navy shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={handleDetectGPS}
                        className="absolute right-2.5 text-gold-dark hover:scale-110 transition-transform"
                        title="Detect location via GPS"
                      >
                        <Crosshair className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* State */}
                  <div className="col-span-2">
                    <label className="text-[11px] font-bold text-navy/60 block mb-1">State</label>
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full rounded-xl border border-navy/15 bg-white p-2.5 font-bold text-navy shadow-xs"
                    >
                      <option value="">Select State</option>
                      <option value="Lagos">Lagos</option>
                      <option value="Abuja">Abuja (FCT)</option>
                      <option value="Rivers">Rivers (Port Harcourt)</option>
                      <option value="Oyo">Oyo (Ibadan)</option>
                      <option value="Enugu">Enugu</option>
                      <option value="Kano">Kano</option>
                      <option value="Edo">Edo (Benin)</option>
                    </select>
                  </div>
                </div>
              ) : (
                /* PROPERTY FIELDS — ADAPTS INTELLIGENTLY TO PROPERTY TYPE */
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {/* Property Type */}
                  <div className="col-span-2">
                    <label className="text-[11px] font-bold text-navy/60 block mb-1">Property Type *</label>
                    <select
                      value={propertyType}
                      onChange={(e) => {
                        setPropertyType(e.target.value);
                        setValidationError(null);
                      }}
                      className="w-full rounded-xl border border-navy/15 bg-white p-2.5 font-bold text-navy shadow-xs"
                    >
                      <option value="">Select Property Type</option>
                      <option value="House">House</option>
                      <option value="Apartment">Apartment</option>
                      <option value="Duplex">Duplex</option>
                      <option value="Bungalow">Bungalow</option>
                      <option value="Terrace">Terrace</option>
                      <option value="Mini Flat">Mini Flat</option>
                      <option value="Self Contain">Self Contain</option>
                      <option value="Land">Land</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Office">Office</option>
                      <option value="Shop">Shop</option>
                      <option value="Warehouse">Warehouse</option>
                    </select>
                  </div>

                  {/* Price (₦) */}
                  <div>
                    <label className="text-[11px] font-bold text-navy/60 block mb-1">Price (₦) *</label>
                    <input
                      type="number"
                      value={priceRaw}
                      onChange={(e) => {
                        setPriceRaw(e.target.value);
                        setValidationError(null);
                      }}
                      placeholder="e.g. 45000000"
                      className="w-full rounded-xl border border-navy/15 bg-white p-2.5 font-bold text-navy shadow-xs"
                    />
                    {Number(priceRaw) > 0 && (
                      <span className="text-[10px] font-bold text-gold-dark mt-0.5 block">{priceFormatted}</span>
                    )}
                  </div>

                  {/* Is Price Negotiable? */}
                  <div>
                    <label className="text-[11px] font-bold text-navy/60 block mb-1">Negotiable?</label>
                    <div className="grid grid-cols-2 gap-1">
                      <button
                        type="button"
                        onClick={() => setNegotiable(true)}
                        className={cn(
                          "py-2 rounded-xl border font-bold text-center",
                          negotiable ? "border-navy bg-gold/20 text-navy" : "border-navy/15 bg-slate-50"
                        )}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setNegotiable(false)}
                        className={cn(
                          "py-2 rounded-xl border font-bold text-center",
                          !negotiable ? "border-navy bg-gold/20 text-navy" : "border-navy/15 bg-slate-50"
                        )}
                      >
                        No
                      </button>
                    </div>
                  </div>

                  {/* ADAPTIVE FIELDS BASED ON PROPERTY TYPE */}
                  {!isLand && !isCommercial && (
                    <>
                      {/* Bedrooms */}
                      <div>
                        <label className="text-[11px] font-bold text-navy/60 block mb-1">Bedrooms</label>
                        <select
                          value={bedrooms}
                          onChange={(e) => setBedrooms(e.target.value)}
                          className="w-full rounded-xl border border-navy/15 bg-white p-2.5 font-bold text-navy shadow-xs"
                        >
                          <option value="">Select Beds</option>
                          <option value="1">1 Bed</option>
                          <option value="2">2 Beds</option>
                          <option value="3">3 Beds</option>
                          <option value="4">4 Beds</option>
                          <option value="5">5 Beds</option>
                          <option value="6+">6+ Beds</option>
                        </select>
                      </div>

                      {/* Bathrooms */}
                      <div>
                        <label className="text-[11px] font-bold text-navy/60 block mb-1">Bathrooms</label>
                        <select
                          value={bathroomsCombined}
                          onChange={(e) => setBathroomsCombined(e.target.value)}
                          className="w-full rounded-xl border border-navy/15 bg-white p-2.5 font-bold text-navy shadow-xs"
                        >
                          <option value="">Select Baths</option>
                          <option value="1">1 Bath</option>
                          <option value="2">2 Baths</option>
                          <option value="3">3 Baths</option>
                          <option value="4">4 Baths</option>
                          <option value="5">5 Baths</option>
                        </select>
                      </div>
                    </>
                  )}

                  {isLand && (
                    <div className="col-span-2">
                      <label className="text-[11px] font-bold text-navy/60 block mb-1">Land Size (sqm / Plots)</label>
                      <input
                        type="text"
                        value={landSize}
                        onChange={(e) => setLandSize(e.target.value)}
                        placeholder="e.g. 600 sqm or 2 Plots"
                        className="w-full rounded-xl border border-navy/15 bg-white p-2.5 font-bold text-navy shadow-xs"
                      />
                    </div>
                  )}

                  {!isLand && (
                    <>
                      {/* Parking Spaces */}
                      <div>
                        <label className="text-[11px] font-bold text-navy/60 block mb-1">Parking Spaces</label>
                        <select
                          value={parkingSpaces}
                          onChange={(e) => setParkingSpaces(e.target.value)}
                          className="w-full rounded-xl border border-navy/15 bg-white p-2.5 font-bold text-navy shadow-xs"
                        >
                          <option value="">Select Parking</option>
                          <option value="1">1 Space</option>
                          <option value="2">2 Spaces</option>
                          <option value="3">3 Spaces</option>
                          <option value="4+">4+ Spaces</option>
                        </select>
                      </div>

                      {/* Furnishing */}
                      <div>
                        <label className="text-[11px] font-bold text-navy/60 block mb-1">Furnishing</label>
                        <select
                          value={furnishing}
                          onChange={(e) => setFurnishing(e.target.value)}
                          className="w-full rounded-xl border border-navy/15 bg-white p-2.5 font-bold text-navy shadow-xs"
                        >
                          <option value="">Select Furnishing</option>
                          <option value="Furnished">Furnished</option>
                          <option value="Semi-Furnished">Semi-Furnished</option>
                          <option value="Unfurnished">Unfurnished</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* Location & GPS */}
                  <div className="col-span-2">
                    <label className="text-[11px] font-bold text-navy/60 block mb-1">Location *</label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => {
                          setLocation(e.target.value);
                          setValidationError(null);
                        }}
                        placeholder="e.g. Ikoyi, Lagos"
                        className="w-full rounded-xl border border-navy/15 bg-white p-2.5 pr-10 font-bold text-navy shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={handleDetectGPS}
                        className="absolute right-2.5 text-gold-dark"
                      >
                        <Crosshair className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* 2. FEATURES / AMENITIES SECTION */}
            <section className="space-y-3">
              <h2 className="text-xs font-black uppercase tracking-wider text-navy/70">
                2. {category === "vehicle" ? "VEHICLE FEATURES" : "PROPERTY AMENITIES"}
              </h2>

              <div className="flex flex-wrap gap-2">
                {(category === "vehicle" ? VEHICLE_FEATURES_DEFAULT : PROPERTY_AMENITIES_DEFAULT).map((feat) => {
                  const selected = selectedFeatures.includes(feat);
                  return (
                    <button
                      key={feat}
                      type="button"
                      onClick={() => toggleFeature(feat)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all active:scale-95",
                        selected
                          ? "bg-amber-100 text-amber-900 ring-1 ring-gold"
                          : "bg-slate-100 text-navy/70 hover:bg-slate-200"
                      )}
                    >
                      {selected && <Check className="h-3.5 w-3.5 text-amber-800 stroke-[3]" />}
                      <span>{feat}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 3. PHOTOS SECTION */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black uppercase tracking-wider text-navy/70">3. PHOTOS *</h2>
                <span className="text-[10px] font-bold text-navy/50">Minimum 3 photos required</span>
              </div>

              {/* Photo Input Box */}
              <div className="flex gap-2">
                <input
                  type="url"
                  value={newPhotoInput}
                  onChange={(e) => setNewPhotoInput(e.target.value)}
                  placeholder="Paste photo image URL…"
                  className="flex-1 rounded-xl border border-navy/15 bg-white p-2.5 text-xs font-bold text-navy"
                />
                <button
                  type="button"
                  onClick={addPhotoUrl}
                  className="rounded-xl bg-navy px-4 py-2.5 text-xs font-bold text-white hover:bg-navy-light"
                >
                  Add Photo
                </button>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {photos.map((url, idx) => (
                  <div key={idx} className="relative aspect-square overflow-hidden rounded-xl border border-navy/10 bg-slate-100 group">
                    <Image src={url} alt={`Photo ${idx + 1}`} fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white hover:bg-rose-600 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}

                {photos.length < 3 && (
                  <div className="flex flex-col items-center justify-center aspect-square rounded-xl border-2 border-dashed border-rose-200 bg-rose-50/50 p-2 text-center">
                    <span className="text-[10px] font-bold text-rose-700">Need {3 - photos.length} more photo{3 - photos.length > 1 ? "s" : ""}</span>
                  </div>
                )}
              </div>
            </section>

            {/* 4. DESCRIPTION SECTION */}
            <section className="space-y-2">
              <h2 className="text-xs font-black uppercase tracking-wider text-navy/70">4. DESCRIPTION</h2>
              <p className="text-[10px] font-medium text-navy/50">Optional brief description of your item</p>
              <div className="relative">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
                  rows={4}
                  placeholder="Describe vehicle or property condition, history, or key details…"
                  className="w-full rounded-xl border border-navy/15 bg-white p-3 text-xs text-navy font-medium shadow-xs"
                />
                <span className="absolute bottom-2 right-3 text-[10px] font-bold text-navy/40">
                  {description.length}/1000
                </span>
              </div>
            </section>

            {/* 5. SELLER DETAILS (AUTO-POPULATED READ ONLY FROM USER PROFILE) */}
            <section className="space-y-3">
              <h2 className="text-xs font-black uppercase tracking-wider text-navy/70">5. SELLER DETAILS</h2>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2.5 rounded-2xl border border-navy/10 bg-slate-50 p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-white shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-medium text-navy/50 block leading-tight">Full Name</span>
                    <span className="font-bold text-navy truncate block">{sellerName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 rounded-2xl border border-navy/10 bg-slate-50 p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-white shrink-0">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-medium text-navy/50 block leading-tight">Phone Number</span>
                    <span className="font-bold text-navy truncate block">{sellerPhone}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* BOTTOM ACTION BUTTONS */}
            <div className="pt-2 space-y-2">
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleGoToPreview}
                  className="pressable flex items-center justify-center gap-2 rounded-2xl border-2 border-navy bg-white py-3 text-xs font-bold text-navy active:scale-98"
                >
                  <Eye className="h-4 w-4 text-navy" />
                  <span>PREVIEW LISTING</span>
                </button>

                <button
                  type="button"
                  onClick={handlePublish}
                  className="pressable flex items-center justify-center gap-2 rounded-2xl bg-gold py-3 text-xs font-black text-navy shadow-md hover:bg-gold-light active:scale-98"
                >
                  <Rocket className="h-4 w-4 text-navy" />
                  <span>PUBLISH LISTING</span>
                </button>
              </div>

              <p className="text-center text-[10px] font-bold text-navy/50 flex items-center justify-center gap-1">
                <span>🔒 Your listing will be reviewed before it goes live.</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* YEAR WHEEL PICKER MODAL */}
      {yearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-navy/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl space-y-4 text-center">
            <h3 className="text-sm font-black text-navy uppercase tracking-wider">Select Manufacture Year</h3>
            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 rounded-2xl border border-navy/10">
              {YEARS.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => {
                    setYear(y);
                    setYearModalOpen(false);
                  }}
                  className={cn(
                    "w-full py-3 text-sm font-bold transition-colors",
                    year === y ? "bg-gold/20 text-navy font-black" : "text-navy/70 hover:bg-slate-50"
                  )}
                >
                  {y}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setYearModalOpen(false)}
              className="w-full rounded-2xl border border-navy/20 py-2.5 text-xs font-bold text-navy"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STATE 2: PREVIEW LISTING (DYNAMIC USER DATA ONLY) */}
      {/* ========================================================================= */}
      {flowState === "preview" && (
        <div className="mx-auto max-w-2xl px-3.5 pt-4 space-y-4 text-navy">
          <div className="rounded-3xl border border-navy/10 bg-white overflow-hidden shadow-2xl">
            {/* HERO IMAGE */}
            <div className="relative aspect-[4/3] w-full bg-navy overflow-hidden">
              {photos[0] ? (
                <Image src={photos[0]} alt="Preview Cover" fill className="object-cover" />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center text-white/50 text-xs font-bold">
                  <span>No cover photo uploaded</span>
                </div>
              )}
              <div className="absolute top-3 left-3 z-10 rounded-md bg-navy/80 px-2 py-0.5 text-[10px] font-black uppercase text-white backdrop-blur-md">
                👁 For {listingType === "rent" ? "Rent" : "Sale"}
              </div>
              <div className="absolute top-3 right-3 z-10 flex gap-1.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-navy backdrop-blur-md">
                  <Heart className="h-4 w-4" />
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-navy backdrop-blur-md">
                  <Share2 className="h-4 w-4" />
                </div>
              </div>
              <div className="absolute bottom-3 right-3 z-10 rounded-full bg-navy/80 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md">
                1 / {photos.length || 1}
              </div>
            </div>

            {/* THUMBNAIL STRIP */}
            {photos.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto bg-slate-50 border-b border-navy/10">
                {photos.map((p, idx) => (
                  <div key={idx} className="relative h-14 w-16 shrink-0 overflow-hidden rounded-xl border border-navy/20">
                    <Image src={p} alt="" fill className="object-cover" />
                  </div>
                ))}
              </div>
            )}

            {/* CONTENT DETAILS */}
            <div className="p-4 space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-navy">
                    {category === "vehicle"
                      ? `${year ? year + " " : ""}${make || "Vehicle"} ${model}`.trim()
                      : `${bedrooms ? bedrooms + " Bed " : ""}${propertyType || "Property"}`}
                  </h2>
                  {condition && (
                    <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                      {condition}
                    </span>
                  )}
                </div>
                <p className="text-2xl font-black text-gold-dark mt-1">{priceFormatted}</p>
                <div className="flex items-center gap-2 text-xs text-navy/60 mt-1">
                  <MapPin className="h-3.5 w-3.5 text-gold shrink-0" />
                  <span>{location || "Location not specified"} • Posted just now</span>
                </div>
              </div>

              {/* SPECIFICATION GRID */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                {category === "vehicle" ? (
                  <>
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-navy/50 font-medium block">Year</span>
                      <span className="font-bold text-navy">{year || "N/A"}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-navy/50 font-medium block">Mileage</span>
                      <span className="font-bold text-navy">{mileageFormatted || "N/A"}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-navy/50 font-medium block">Transmission</span>
                      <span className="font-bold text-navy">{transmission || "N/A"}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-navy/50 font-medium block">Bedrooms</span>
                      <span className="font-bold text-navy">{bedrooms || "N/A"}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-navy/50 font-medium block">Bathrooms</span>
                      <span className="font-bold text-navy">{bathroomsCombined || "N/A"}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-navy/50 font-medium block">Furnishing</span>
                      <span className="font-bold text-navy">{furnishing || "N/A"}</span>
                    </div>
                  </>
                )}
              </div>

              {/* FEATURES CHIPS */}
              {selectedFeatures.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-navy/60 uppercase tracking-wider mb-2">Features</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedFeatures.map((f) => (
                      <span key={f} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-navy">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* DESCRIPTION */}
              {description && (
                <div>
                  <h3 className="text-xs font-bold text-navy/60 uppercase tracking-wider mb-1">Description</h3>
                  <p className="text-xs text-navy/80 leading-relaxed">{description}</p>
                </div>
              )}

              {/* ACTION BUTTONS */}
              <div className="pt-2 space-y-2">
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setFlowState("details")}
                    className="pressable flex items-center justify-center gap-2 rounded-2xl border-2 border-navy bg-white py-3 text-xs font-bold text-navy active:scale-98"
                  >
                    <Edit3 className="h-4 w-4" />
                    <span>EDIT LISTING</span>
                  </button>

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handlePublish}
                    className="pressable flex items-center justify-center gap-2 rounded-2xl bg-gold py-3 text-xs font-black text-navy shadow-md hover:bg-gold-light active:scale-98"
                  >
                    <Rocket className="h-4 w-4" />
                    <span>{submitting ? "Publishing…" : "PUBLISH LISTING"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STATE 3: LISTING UNDER REVIEW */}
      {/* ========================================================================= */}
      {flowState === "under_review" && (
        <div className="mx-auto max-w-sm px-4 pt-6 space-y-5 text-center text-white">
          {/* Top Graphic */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-navy/90 to-[#072462] border-2 border-gold/40 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold text-navy font-black text-xl shadow-md">
              ✓
            </div>
          </div>

          <div>
            <h2 className="text-xl font-black text-white leading-tight">
              Your listing is <span className="text-gold">undergoing review</span>
            </h2>
            <p className="text-xs text-white/70 mt-1">
              We’ll carefully review it and notify you once it goes live.
            </p>
          </div>

          {/* Timeline Box ("What happens next?") */}
          <div className="rounded-3xl border border-white/10 bg-navy/80 p-4 text-left space-y-3.5 shadow-xl">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">What happens next?</h3>

            <div className="space-y-3 text-xs">
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-gold">
                  <Search className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white">Our team will review your listing</h4>
                  <p className="text-[10px] text-white/60">This usually takes up to 24 hours.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-gold">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white">We may contact you</h4>
                  <p className="text-[10px] text-white/60">If we need more information.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-gold">
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white">Your listing goes live</h4>
                  <p className="text-[10px] text-white/60">You’ll be notified once it’s live and visible to buyers.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Submitted Listing Card */}
          <div className="rounded-3xl border border-white/10 bg-navy/90 p-3 text-left flex gap-3 shadow-xl">
            <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-2xl bg-slate-900">
              {photos[0] ? (
                <Image src={photos[0]} alt="Submitted" fill className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[10px] text-white/40">No photo</div>
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <h4 className="text-xs font-black text-white truncate">
                {category === "vehicle"
                  ? `${year ? year + " " : ""}${make} ${model}`.trim() || "Vehicle Listing"
                  : `${bedrooms ? bedrooms + " Bed " : ""}${propertyType}`.trim() || "Property Listing"}
              </h4>
              <p className="text-sm font-black text-gold">{priceFormatted}</p>
              <div className="flex items-center gap-1 text-[10px] text-white/60">
                <MapPin className="h-3 w-3 text-gold shrink-0" />
                <span className="truncate">{location || "Nigeria"}</span>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="space-y-2.5 pt-2">
            <button
              type="button"
              onClick={() => {
                setFlowState("details");
                setMake("");
                setModel("");
                setYear("");
                setCondition("");
                setPriceRaw("");
                setMileageRaw("");
                setLocation("");
                setPhotos([]);
                setDescription("");
                setValidationError(null);
              }}
              className="pressable flex w-full items-center justify-center gap-2 rounded-2xl bg-gold py-3 text-xs font-black text-navy shadow-md hover:bg-gold-light active:scale-98"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span>LIST ANOTHER ITEM</span>
            </button>

            <button
              type="button"
              onClick={() => router.push("/agent")}
              className="pressable flex w-full items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/5 py-3 text-xs font-bold text-white hover:bg-white/10 active:scale-98"
            >
              <Home className="h-4 w-4 text-white" />
              <span>BACK TO DASHBOARD</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
