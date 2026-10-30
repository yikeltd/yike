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
  Clock,
  Weight,
} from "lucide-react";
import type { Property } from "@/types/database";
import {
  isMachineryCategory,
  isRoadMileageCategory,
  vehicleCategoryLabel,
} from "@/lib/marketplace/vehicle-specs";
import { SpecSection, type SpecItem } from "@/components/ui/info-tile";

function conditionLabel(value?: string | null): string | null {
  if (!value) return null;
  const v = value.toLowerCase().replace(/_/g, " ");
  if (v.includes("foreign") || v === "tokunbo") return "Foreign used";
  if (v.includes("nigeria") || v === "local") return "Nigerian used";
  if (v.includes("refurb")) return "Refurbished";
  if (v.includes("new") || v === "brand new") return "Brand new";
  return value;
}

function attr(vehicle: Property, key: string): string | number | null {
  const attrs = (vehicle.attributes ?? {}) as Record<string, unknown>;
  const v = attrs[key];
  if (v == null || v === "") return null;
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v);
}

export function VehicleSpecSections({ vehicle }: { vehicle: Property }) {
  const machinery = isMachineryCategory(vehicle.auto_category);
  const roadMileage = isRoadMileageCategory(vehicle.auto_category);

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
    { icon: Tag, label: "Seller type", value: attr(vehicle, "seller_type") },
  ];

  const performance: SpecItem[] = [];
  if (roadMileage) {
    performance.push({
      icon: Gauge,
      label: "Mileage",
      value:
        vehicle.mileage != null
          ? `${vehicle.mileage.toLocaleString()} km`
          : null,
    });
    performance.push(
      { icon: Settings2, label: "Transmission", value: vehicle.transmission },
      { icon: Fuel, label: "Fuel", value: vehicle.fuel_type },
    );
  }
  if (machinery || vehicle.engine) {
    performance.push(
      { icon: Cog, label: "Engine / power", value: vehicle.engine },
      {
        icon: Clock,
        label: "Operating hours",
        value: attr(vehicle, "operating_hours"),
      },
      {
        icon: Weight,
        label: "Operating weight / capacity",
        value: attr(vehicle, "operating_weight"),
      },
      {
        icon: Cog,
        label: "Horsepower / rated power",
        value: attr(vehicle, "horsepower"),
      },
      { icon: CircleDot, label: "Drive / track", value: attr(vehicle, "drive_type") },
    );
  }
  if (!machinery && roadMileage) {
    performance.push(
      { icon: Cog, label: "Engine", value: vehicle.engine },
      { icon: CircleDot, label: "Drivetrain", value: vehicle.drivetrain },
    );
  }

  const exterior: SpecItem[] = [
    { icon: Car, label: "Body", value: vehicle.body_type },
    { icon: Palette, label: "Exterior", value: vehicle.exterior_color },
    { icon: Tag, label: "Class / use", value: attr(vehicle, "vehicle_class") },
    { icon: Weight, label: "Payload / GVW", value: attr(vehicle, "payload_capacity") },
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
    { icon: Tag, label: "Attachments", value: attr(vehicle, "attachments") },
    {
      icon: Settings2,
      label: "Service history",
      value: attr(vehicle, "service_history"),
    },
    {
      icon: Tag,
      label: "Applications",
      value: attr(vehicle, "suitable_applications"),
    },
    {
      icon: Cog,
      label: "Implement compatibility",
      value: attr(vehicle, "implement_compatibility"),
    },
  ];

  const sections = [
    { title: "Overview", items: overview },
    { title: roadMileage || machinery ? "Performance" : "Details", items: performance },
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
          items={section.items.filter((i) => i.value != null && i.value !== "")}
        />
      ))}
    </div>
  );
}
