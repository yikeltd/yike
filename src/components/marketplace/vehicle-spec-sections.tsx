import {
  Calendar,
  Car,
  Fuel,
  Gauge,
  MapPin,
  Palette,
  Settings2,
  ShieldCheck,
  Cog,
  CircleDot,
  Wallet,
  Tag,
} from "lucide-react";
import type { Property } from "@/types/database";
import { vehicleCategoryLabel } from "@/lib/marketplace/vehicle-specs";
import { SpecSection, type SpecItem } from "@/components/ui/info-tile";

function conditionLabel(value?: string | null): string | null {
  if (!value) return null;
  const v = value.toLowerCase().replace(/_/g, " ");
  if (v.includes("foreign") || v === "tokunbo") return "Foreign used";
  if (v.includes("nigeria") || v === "local") return "Nigerian used";
  if (v.includes("new") || v === "brand new") return "Brand new";
  return value;
}

export function VehicleSpecSections({ vehicle }: { vehicle: Property }) {
  const overview: SpecItem[] = [
    {
      icon: Car,
      label: "Category",
      value: vehicleCategoryLabel(vehicle.auto_category),
    },
    { icon: Tag, label: "Make", value: vehicle.make },
    { icon: Tag, label: "Model", value: vehicle.model },
    { icon: Calendar, label: "Year", value: vehicle.year },
    { icon: Settings2, label: "Trim", value: vehicle.trim },
    {
      icon: ShieldCheck,
      label: "Condition",
      value: conditionLabel(vehicle.vehicle_condition),
    },
    {
      icon: MapPin,
      label: "Location",
      value: [vehicle.area, vehicle.city, vehicle.state].filter(Boolean).join(", "),
    },
  ];

  const performance: SpecItem[] = [
    {
      icon: Gauge,
      label: "Mileage",
      value:
        vehicle.mileage != null
          ? `${vehicle.mileage.toLocaleString()} km`
          : null,
    },
    { icon: Settings2, label: "Transmission", value: vehicle.transmission },
    { icon: Fuel, label: "Fuel", value: vehicle.fuel_type },
    { icon: Cog, label: "Engine", value: vehicle.engine },
    { icon: CircleDot, label: "Drivetrain", value: vehicle.drivetrain },
  ];

  const exterior: SpecItem[] = [
    { icon: Car, label: "Body", value: vehicle.body_type },
    { icon: Palette, label: "Exterior", value: vehicle.exterior_color },
  ];

  const interior: SpecItem[] = [
    { icon: Palette, label: "Interior", value: vehicle.interior_color },
  ];

  const technical: SpecItem[] = [
    {
      icon: ShieldCheck,
      label: "Registration",
      value: vehicle.registration_status,
    },
    {
      icon: Wallet,
      label: "Financing",
      value: vehicle.financing_available ? "Available" : null,
    },
  ];

  const sections = [
    { title: "Overview", items: overview },
    { title: "Performance", items: performance },
    { title: "Exterior", items: exterior },
    { title: "Interior", items: interior },
    { title: "Technical", items: technical },
  ];

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <SpecSection
          key={section.title}
          title={section.title}
          items={section.items}
        />
      ))}
    </div>
  );
}
