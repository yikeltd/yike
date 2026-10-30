/**
 * Generates src/lib/sample-listings/catalog-listings.generated.ts
 * Run: npx tsx scripts/generate-ninety-sample-catalog.ts
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const LOCATIONS = [
  { state: "Lagos", city: "Lagos", area: "Yaba" },
  { state: "Lagos", city: "Lagos", area: "Surulere" },
  { state: "Lagos", city: "Lagos", area: "Ajah" },
  { state: "Lagos", city: "Lagos", area: "Festac" },
  { state: "Lagos", city: "Lagos", area: "Chevron" },
  { state: "FCT", city: "Abuja", area: "Gwarinpa" },
  { state: "FCT", city: "Abuja", area: "Lugbe" },
  { state: "FCT", city: "Abuja", area: "Kubwa" },
  { state: "Rivers", city: "Port Harcourt", area: "Rumuokoro" },
  { state: "Enugu", city: "Enugu", area: "Trans Ekulu" },
  { state: "Imo", city: "Owerri", area: "Ikenegbu" },
  { state: "Abia", city: "Aba", area: "Ogbor Hill" },
  { state: "Kano", city: "Kano", area: "Nassarawa" },
  { state: "Oyo", city: "Ibadan", area: "Bodija" },
  { state: "Delta", city: "Warri", area: "Effurun" },
  { state: "Edo", city: "Benin City", area: "GRA" },
  { state: "Kaduna", city: "Kaduna", area: "Barnawa" },
  { state: "Ogun", city: "Abeokuta", area: "Sango" },
  { state: "Anambra", city: "Onitsha", area: "Fegge" },
  { state: "Akwa Ibom", city: "Uyo", area: "Ewet Housing" },
  { state: "FCT", city: "Abuja", area: "Maitama" },
];

type PropSpec = {
  slug: string;
  title: string;
  description: string;
  listing_type: "rent" | "sale" | "shortlet";
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  price: number;
  payment_period: "yearly" | "monthly" | "total" | "daily";
  loc: number;
  seller: 0 | 1 | 2;
  featured?: boolean;
};

const PROPERTY_SPECS: PropSpec[] = [
  { slug: "sample-3bed-flat-lekki-rent", title: "3-Bedroom Flat for Rent — Lekki Phase 1", description: "Serviced flat with generator, parking and security. Close to Lekki-Ikoyi link bridge.", listing_type: "rent", property_type: "flat_3", bedrooms: 3, bathrooms: 3, price: 4_500_000, payment_period: "yearly", loc: 0, seller: 0, featured: true },
  { slug: "sample-duplex-sale-abuja-maitama", title: "5-Bed Detached Duplex for Sale — Maitama", description: "Fully fitted duplex with BQ, CCTV and inverter backup in a quiet Maitama street.", listing_type: "sale", property_type: "detached_duplex", bedrooms: 5, bathrooms: 5, price: 320_000_000, payment_period: "total", loc: 20, seller: 0, featured: true },
  { slug: "sample-2bed-apartment-vi-rent", title: "2-Bed Apartment — Victoria Island (Annual Rent)", description: "Corporate-friendly apartment with elevator access and backup power.", listing_type: "rent", property_type: "flat_2", bedrooms: 2, bathrooms: 2, price: 6_000_000, payment_period: "yearly", loc: 0, seller: 0 },
  { slug: "sample-residential-land-enugu", title: "Residential Plot — Independence Layout Enugu", description: "600 sqm dry land with verified survey in a developed layout.", listing_type: "sale", property_type: "land_residential", bedrooms: 0, bathrooms: 0, price: 18_000_000, payment_period: "total", loc: 9, seller: 2 },
  { slug: "sample-shop-commercial-ph", title: "Commercial Shop Space — Port Harcourt GRA", description: "Ground-floor shop with wide frontage suitable for retail or showroom.", listing_type: "rent", property_type: "shop", bedrooms: 0, bathrooms: 1, price: 2_800_000, payment_period: "yearly", loc: 8, seller: 0 },
  { slug: "sample-bungalow-sale-owerri", title: "4-Bed Bungalow for Sale — New Owerri", description: "Spacious compound, borehole and tiled interior throughout.", listing_type: "sale", property_type: "bungalow", bedrooms: 4, bathrooms: 4, price: 42_000_000, payment_period: "total", loc: 10, seller: 0 },
  { slug: "sample-mini-flat-aba-rent", title: "Mini Flat for Rent — Aba GRA", description: "Affordable starter home with prepaid meter and shared parking.", listing_type: "rent", property_type: "mini_flat", bedrooms: 1, bathrooms: 1, price: 550_000, payment_period: "yearly", loc: 11, seller: 0 },
  { slug: "sample-warehouse-lagos-sale", title: "Warehouse for Sale — Apapa Lagos", description: "Industrial warehouse with loading bay and office annex.", listing_type: "sale", property_type: "warehouse", bedrooms: 0, bathrooms: 2, price: 450_000_000, payment_period: "total", loc: 0, seller: 0 },
  { slug: "sample-terrace-duplex-enugu-rent", title: "Terrace Duplex for Rent — Enugu GRA", description: "Family home with ensuite rooms and estate security.", listing_type: "rent", property_type: "terrace_duplex", bedrooms: 4, bathrooms: 4, price: 3_600_000, payment_period: "yearly", loc: 9, seller: 0, featured: true },
  { slug: "sample-office-abuja-wuse", title: "Office Space — Wuse 2 Abuja", description: "Open-plan office floor with reception area and dedicated parking.", listing_type: "rent", property_type: "office", bedrooms: 0, bathrooms: 3, price: 5_500_000, payment_period: "yearly", loc: 5, seller: 0 },
  { slug: "sample-4bed-flat-yaba-rent", title: "4-Bedroom Flat — Yaba Lagos", description: "Near UNILAG. Tiled floors, water heater, dedicated parking bay.", listing_type: "rent", property_type: "flat", bedrooms: 4, bathrooms: 3, price: 3_200_000, payment_period: "yearly", loc: 0, seller: 0 },
  { slug: "sample-self-contained-surulere", title: "Self Contained — Surulere", description: "Compact unit ideal for young professionals. Prepaid meter.", listing_type: "rent", property_type: "self_contained", bedrooms: 1, bathrooms: 1, price: 750_000, payment_period: "yearly", loc: 1, seller: 0 },
  { slug: "sample-penthouse-ajah-sale", title: "Penthouse for Sale — Ajah", description: "Top-floor unit with private terrace and sea view.", listing_type: "sale", property_type: "penthouse", bedrooms: 4, bathrooms: 4, price: 95_000_000, payment_period: "total", loc: 2, seller: 0, featured: true },
  { slug: "sample-commercial-land-ibadan", title: "Commercial Land — Bodija Ibadan", description: "Corner plot on main road, suitable for fuel station or plaza.", listing_type: "sale", property_type: "land_commercial", bedrooms: 0, bathrooms: 0, price: 55_000_000, payment_period: "total", loc: 13, seller: 0 },
  { slug: "sample-shortlet-ikoyi-daily", title: "Shortlet 2-Bed — Ikoyi", description: "Fully furnished executive apartment. Daily housekeeping available.", listing_type: "shortlet", property_type: "flat_2", bedrooms: 2, bathrooms: 2, price: 95_000, payment_period: "daily", loc: 0, seller: 0 },
  { slug: "sample-semi-detached-kaduna", title: "Semi-Detached Duplex — Barnawa Kaduna", description: "Family estate with borehole and generator house.", listing_type: "sale", property_type: "semi_detached_duplex", bedrooms: 4, bathrooms: 4, price: 68_000_000, payment_period: "total", loc: 16, seller: 0 },
  { slug: "sample-hostel-bedspace-lagos", title: "Hostel Bedspace — Yaba (Monthly)", description: "Secure hostel for students near polytechnic corridor.", listing_type: "rent", property_type: "hostel", bedrooms: 1, bathrooms: 1, price: 120_000, payment_period: "monthly", loc: 0, seller: 2 },
  { slug: "sample-plaza-unit-onitsha", title: "Plaza Shop Unit — Onitsha Main Market", description: "Upper-floor unit overlooking market road. High foot traffic.", listing_type: "rent", property_type: "shop", bedrooms: 0, bathrooms: 1, price: 1_200_000, payment_period: "yearly", loc: 18, seller: 0 },
  { slug: "sample-mansion-asokoro-sale", title: "6-Bed Mansion — Asokoro Abuja", description: "Ambassadorial zone property with swimming pool and smart home wiring.", listing_type: "sale", property_type: "mansion", bedrooms: 6, bathrooms: 7, price: 850_000_000, payment_period: "total", loc: 5, seller: 0, featured: true },
  { slug: "sample-flat-festac-rent", title: "3-Bed Flat — Festac Town", description: "Renovated flat with POP ceiling and kitchen cabinets.", listing_type: "rent", property_type: "flat_3", bedrooms: 3, bathrooms: 2, price: 1_900_000, payment_period: "yearly", loc: 3, seller: 0 },
  { slug: "sample-agricultural-land-benin", title: "Agricultural Land — Benin Outskirts", description: "2 hectares with access road. Suitable for poultry or crop farming.", listing_type: "sale", property_type: "land_agricultural", bedrooms: 0, bathrooms: 0, price: 12_000_000, payment_period: "total", loc: 15, seller: 0 },
  { slug: "sample-block-of-flats-warri", title: "Block of 6 Flats — Warri", description: "Investment property with mixed 2 & 3 bedroom units, fully tenanted.", listing_type: "sale", property_type: "block_of_flats", bedrooms: 0, bathrooms: 0, price: 210_000_000, payment_period: "total", loc: 14, seller: 0 },
  { slug: "sample-studio-chevron-rent", title: "Studio Apartment — Chevron Drive", description: "Open-plan studio in gated estate. 24/7 security.", listing_type: "rent", property_type: "studio", bedrooms: 1, bathrooms: 1, price: 2_400_000, payment_period: "yearly", loc: 4, seller: 0 },
  { slug: "sample-detached-house-uyo", title: "Detached 5-Bed House — Uyo", description: "Quiet residential street, boys quarter and paved compound.", listing_type: "sale", property_type: "detached_house", bedrooms: 5, bathrooms: 5, price: 78_000_000, payment_period: "total", loc: 19, seller: 0 },
  { slug: "sample-event-center-lagos", title: "Event Center Hall — Ikeja", description: "600-capacity hall with parking and catering prep area.", listing_type: "rent", property_type: "event_center", bedrooms: 0, bathrooms: 4, price: 8_500_000, payment_period: "yearly", loc: 0, seller: 0 },
  { slug: "sample-flat-kano-rent", title: "2-Bed Flat — Nassarawa Kano", description: "Tiled interior, borehole water, close to main road.", listing_type: "rent", property_type: "flat_2", bedrooms: 2, bathrooms: 2, price: 900_000, payment_period: "yearly", loc: 12, seller: 0 },
  { slug: "sample-warehouse-rent-abeokuta", title: "Warehouse to Let — Sango Ota", description: "12m clearance height, ideal for logistics and light manufacturing.", listing_type: "rent", property_type: "warehouse", bedrooms: 0, bathrooms: 2, price: 4_200_000, payment_period: "yearly", loc: 17, seller: 0 },
  { slug: "sample-hotel-lodge-enugu", title: "Boutique Lodge — Enugu", description: "12-room lodge with restaurant space and generator.", listing_type: "sale", property_type: "hotel", bedrooms: 12, bathrooms: 14, price: 165_000_000, payment_period: "total", loc: 9, seller: 0 },
  { slug: "sample-terrace-abuja-lugbe", title: "3-Bed Terrace — Lugbe Abuja", description: "Estate with paved roads and steady power.", listing_type: "rent", property_type: "terrace", bedrooms: 3, bathrooms: 3, price: 1_800_000, payment_period: "yearly", loc: 6, seller: 0 },
  { slug: "sample-commercial-office-ph", title: "Grade A Office Suite — PHCBD", description: "Fitted office with reception and 2 meeting rooms.", listing_type: "rent", property_type: "office", bedrooms: 0, bathrooms: 2, price: 6_800_000, payment_period: "yearly", loc: 8, seller: 0 },
];

type VehSpec = {
  slug: string;
  title: string;
  description: string;
  price: number;
  auto_category: string;
  make: string;
  model: string;
  year: number;
  transmission?: string;
  fuel_type?: string;
  mileage?: number;
  vehicle_condition: string;
  loc: number;
  seller: 0 | 1 | 2;
  featured?: boolean;
  attributes?: Record<string, string | number | boolean>;
};

const VEHICLE_SPECS: VehSpec[] = [
  { slug: "sample-toyota-camry-2019-lagos", title: "Toyota Camry 2019 — Foreign Used", description: "Clean title, full service history, leather interior.", price: 14_500_000, auto_category: "car", make: "Toyota", model: "Camry", year: 2019, transmission: "automatic", fuel_type: "petrol", mileage: 62000, vehicle_condition: "foreign_used", loc: 0, seller: 1, featured: true },
  { slug: "sample-lexus-rx350-2020-ph", title: "Lexus RX 350 2020 — SUV", description: "Premium SUV with panoramic roof and navigation.", price: 38_000_000, auto_category: "suv", make: "Lexus", model: "RX 350", year: 2020, transmission: "automatic", fuel_type: "petrol", mileage: 41000, vehicle_condition: "foreign_used", loc: 8, seller: 1, featured: true },
  { slug: "sample-toyota-hilux-2021-enugu", title: "Toyota Hilux 2021 — Pickup", description: "4x4 double cab, ideal for construction and logistics.", price: 28_000_000, auto_category: "pickup_van", make: "Toyota", model: "Hilux", year: 2021, transmission: "automatic", fuel_type: "diesel", mileage: 35000, vehicle_condition: "foreign_used", loc: 9, seller: 1 },
  { slug: "sample-ford-transit-2018-ph", title: "Toyota Coaster 2018 — Passenger Bus", description: "18-seater bus in good mechanical condition.", price: 9_500_000, auto_category: "bus_minibus", make: "Toyota", model: "Coaster", year: 2018, transmission: "manual", fuel_type: "diesel", mileage: 145000, vehicle_condition: "nigerian_used", loc: 8, seller: 1 },
  { slug: "sample-caterpillar-excavator-2019-lagos", title: "[Sample] Caterpillar 320 Excavator — 4,200 hrs", description: "Development fixture. 20-ton excavator for construction.", price: 185_000_000, auto_category: "excavator", make: "Caterpillar", model: "320 GC", year: 2019, fuel_type: "diesel", vehicle_condition: "foreign_used", loc: 0, seller: 1, featured: true, attributes: { operating_hours: 4200, operating_weight: 20 } },
  { slug: "sample-john-deere-tractor-enugu", title: "[Sample] John Deere 5075E Tractor", description: "Farm tractor with PTO for planters and trailers.", price: 42_000_000, auto_category: "tractor", make: "John Deere", model: "5075E", year: 2016, fuel_type: "diesel", vehicle_condition: "used", loc: 9, seller: 1, attributes: { horsepower: 75, operating_hours: 3100 } },
  { slug: "sample-howo-tipper-truck-2020", title: "[Sample] SinoTruck HOWO 371 Tipper", description: "Commercial dump truck for haulage and quarry work.", price: 38_500_000, auto_category: "dump_hauler", make: "SinoTruck", model: "HOWO 371", year: 2020, transmission: "manual", fuel_type: "diesel", mileage: 92000, vehicle_condition: "foreign_used", loc: 17, seller: 1, attributes: { payload_capacity: 30 } },
  { slug: "sample-bajaj-keke-abia", title: "[Sample] Bajaj RE Tricycle — Keke Napep", description: "Passenger tricycle in good running condition.", price: 1_450_000, auto_category: "motorcycle_tricycle", make: "Bajaj", model: "RE", year: 2022, fuel_type: "petrol", mileage: 12000, vehicle_condition: "nigerian_used", loc: 11, seller: 2 },
  { slug: "sample-perkins-generator-industrial", title: "[Sample] Perkins 500 kVA Industrial Generator", description: "Industrial power unit for factories and estates.", price: 28_000_000, auto_category: "industrial_generator", make: "Perkins", model: "500 kVA", year: 2018, fuel_type: "diesel", vehicle_condition: "refurbished", loc: 0, seller: 1, attributes: { operating_hours: 1800 } },
  { slug: "sample-toyota-forklift-lagos", title: "[Sample] Toyota 8FG25 Forklift", description: "Warehouse forklift, 2.5 ton capacity.", price: 12_500_000, auto_category: "forklift_telehandler", make: "Toyota", model: "8FG25", year: 2015, fuel_type: "lpg", vehicle_condition: "used", loc: 0, seller: 1, attributes: { operating_hours: 5600 } },
  { slug: "sample-honda-accord-2017-abuja", title: "Honda Accord 2017 — Nigerian Used", description: "Well maintained sedan, AC chilling, new tyres.", price: 8_200_000, auto_category: "car", make: "Honda", model: "Accord", year: 2017, transmission: "automatic", fuel_type: "petrol", mileage: 98000, vehicle_condition: "nigerian_used", loc: 5, seller: 1 },
  { slug: "sample-mercedes-gle-2021-lagos", title: "Mercedes-Benz GLE 450 2021", description: "Foreign used luxury SUV with ambient lighting.", price: 62_000_000, auto_category: "suv", make: "Mercedes-Benz", model: "GLE 450", year: 2021, transmission: "automatic", fuel_type: "petrol", mileage: 28000, vehicle_condition: "foreign_used", loc: 4, seller: 1, featured: true },
  { slug: "sample-toyota-corolla-2020-ibadan", title: "Toyota Corolla 2020 — Ibadan", description: "Economical sedan for ride-hailing or family use.", price: 11_800_000, auto_category: "car", make: "Toyota", model: "Corolla", year: 2020, transmission: "automatic", fuel_type: "petrol", mileage: 54000, vehicle_condition: "foreign_used", loc: 13, seller: 1 },
  { slug: "sample-yamaha-motorcycle-kano", title: "Yamaha YBR 125 Motorcycle", description: "Delivery bike with papers and helmet included.", price: 680_000, auto_category: "motorcycle_tricycle", make: "Yamaha", model: "YBR 125", year: 2021, transmission: "manual", fuel_type: "petrol", mileage: 8000, vehicle_condition: "nigerian_used", loc: 12, seller: 2 },
  { slug: "sample-toyota-hiace-bus-lagos", title: "Toyota HiAce 2015 — 14 Seater", description: "Inter-city shuttle bus, strong engine.", price: 7_200_000, auto_category: "bus_minibus", make: "Toyota", model: "HiAce", year: 2015, transmission: "manual", fuel_type: "petrol", mileage: 168000, vehicle_condition: "nigerian_used", loc: 1, seller: 1 },
  { slug: "sample-ford-ranger-pickup-enugu", title: "Ford Ranger 2018 XLT Pickup", description: "Double cab pickup for site supervision.", price: 16_500_000, auto_category: "pickup_van", make: "Ford", model: "Ranger", year: 2018, transmission: "automatic", fuel_type: "diesel", mileage: 88000, vehicle_condition: "foreign_used", loc: 9, seller: 1 },
  { slug: "sample-peugeot-301-benin", title: "Peugeot 301 2019", description: "Compact sedan, low fuel consumption.", price: 6_400_000, auto_category: "car", make: "Peugeot", model: "301", year: 2019, transmission: "manual", fuel_type: "petrol", mileage: 72000, vehicle_condition: "nigerian_used", loc: 15, seller: 1 },
  { slug: "sample-hyundai-elantra-2022", title: "Hyundai Elantra 2022", description: "Nearly new sedan with factory warranty balance.", price: 17_500_000, auto_category: "car", make: "Hyundai", model: "Elantra", year: 2022, transmission: "automatic", fuel_type: "petrol", mileage: 22000, vehicle_condition: "foreign_used", loc: 2, seller: 1 },
  { slug: "sample-kia-sorento-suv-warri", title: "Kia Sorento 2019 SUV", description: "7-seater family SUV, leather seats.", price: 19_800_000, auto_category: "suv", make: "Kia", model: "Sorento", year: 2019, transmission: "automatic", fuel_type: "petrol", mileage: 76000, vehicle_condition: "foreign_used", loc: 14, seller: 1 },
  { slug: "sample-nissan-altima-2018", title: "Nissan Altima 2018", description: "Comfortable mid-size sedan.", price: 9_100_000, auto_category: "car", make: "Nissan", model: "Altima", year: 2018, transmission: "automatic", fuel_type: "petrol", mileage: 91000, vehicle_condition: "nigerian_used", loc: 3, seller: 1 },
  { slug: "sample-toyota-sienna-minivan", title: "Toyota Sienna 2016 — Family Van", description: "8-seater van for school runs and airport jobs.", price: 10_500_000, auto_category: "bus_minibus", make: "Toyota", model: "Sienna", year: 2016, transmission: "automatic", fuel_type: "petrol", mileage: 112000, vehicle_condition: "foreign_used", loc: 0, seller: 1 },
  { slug: "sample-lexus-es350-lagos", title: "Lexus ES 350 2018", description: "Executive sedan with beige interior.", price: 18_900_000, auto_category: "car", make: "Lexus", model: "ES 350", year: 2018, transmission: "automatic", fuel_type: "petrol", mileage: 67000, vehicle_condition: "foreign_used", loc: 4, seller: 1 },
  { slug: "sample-toyota-prado-2014", title: "Toyota Land Cruiser Prado 2014", description: "Rugged SUV with 7 seats.", price: 24_000_000, auto_category: "suv", make: "Toyota", model: "Land Cruiser Prado", year: 2014, transmission: "automatic", fuel_type: "diesel", mileage: 134000, vehicle_condition: "foreign_used", loc: 6, seller: 1, featured: true },
  { slug: "sample-isuzu-truck-2017", title: "Isuzu NQR Light Truck 2017", description: "3.5 ton cargo truck for distribution.", price: 13_800_000, auto_category: "pickup_van", make: "Isuzu", model: "NQR", year: 2017, transmission: "manual", fuel_type: "diesel", mileage: 102000, vehicle_condition: "nigerian_used", loc: 8, seller: 1 },
  { slug: "sample-tvs-tricycle-delta", title: "TVS King Tricycle — Delta", description: "Commercial keke for hire.", price: 1_250_000, auto_category: "motorcycle_tricycle", make: "TVS", model: "King", year: 2020, fuel_type: "petrol", mileage: 24000, vehicle_condition: "nigerian_used", loc: 14, seller: 2 },
  { slug: "sample-bmw-x5-2019", title: "BMW X5 xDrive40i 2019", description: "Premium SUV with adaptive cruise.", price: 48_000_000, auto_category: "suv", make: "BMW", model: "X5", year: 2019, transmission: "automatic", fuel_type: "petrol", mileage: 52000, vehicle_condition: "foreign_used", loc: 5, seller: 1 },
  { slug: "sample-volkswagen-jetta-2016", title: "Volkswagen Jetta 2016", description: "German sedan, turbo engine.", price: 7_800_000, auto_category: "car", make: "Volkswagen", model: "Jetta", year: 2016, transmission: "automatic", fuel_type: "petrol", mileage: 99000, vehicle_condition: "foreign_used", loc: 16, seller: 1 },
  { slug: "sample-mazda-cx5-2020", title: "Mazda CX-5 2020", description: "Crossover SUV with low mileage.", price: 21_500_000, auto_category: "suv", make: "Mazda", model: "CX-5", year: 2020, transmission: "automatic", fuel_type: "petrol", mileage: 38000, vehicle_condition: "foreign_used", loc: 19, seller: 1 },
  { slug: "sample-toyota-avanza-2018", title: "Toyota Avanza 2018 — Compact MPV", description: "7-seater for ride-share and family.", price: 8_900_000, auto_category: "car", make: "Toyota", model: "Avanza", year: 2018, transmission: "automatic", fuel_type: "petrol", mileage: 86000, vehicle_condition: "foreign_used", loc: 18, seller: 1 },
  { slug: "sample-man-diesel-truck-2015", title: "[Sample] MAN Diesel Truck — 15 Ton", description: "Long haul truck for logistics companies.", price: 22_000_000, auto_category: "dump_hauler", make: "MAN", model: "TGS 33.360", year: 2015, transmission: "manual", fuel_type: "diesel", mileage: 210000, vehicle_condition: "used", loc: 17, seller: 1, attributes: { payload_capacity: 15 } },
];

type ElecSpec = {
  slug: string;
  title: string;
  description: string;
  price: number;
  auto_category: string;
  brand: string;
  model: string;
  condition: string;
  loc: number;
  seller: 0 | 1 | 2;
  featured?: boolean;
  attributes: Record<string, string | number>;
};

const ELECTRONICS_SPECS: ElecSpec[] = [
  { slug: "sample-samsung-galaxy-s24-lagos", title: "Samsung Galaxy S24 — 256GB", description: "UK used, battery health 94%, box and charger included.", price: 680_000, auto_category: "phones_tablets", brand: "Samsung", model: "Galaxy S24", condition: "foreign_used", loc: 0, seller: 2, featured: true, attributes: { storage_gb: 256, ram_gb: 8 } },
  { slug: "sample-iphone-15-pro-max-abuja", title: "Apple iPhone 15 Pro Max — 256GB", description: "Face ID OK, no iCloud lock.", price: 1_150_000, auto_category: "phones_tablets", brand: "Apple", model: "iPhone 15 Pro Max", condition: "foreign_used", loc: 5, seller: 2, attributes: { storage_gb: 256 } },
  { slug: "sample-hp-laptop-enugu", title: "HP EliteBook 840 G8 — Core i7", description: "16GB RAM, 512GB SSD, Windows 11 Pro.", price: 520_000, auto_category: "computers", brand: "HP", model: "EliteBook 840 G8", condition: "refurbished", loc: 9, seller: 2, attributes: { ram_gb: 16, storage_gb: 512 } },
  { slug: "sample-lg-55-tv-ph", title: "LG 55\" 4K Smart TV", description: "WebOS smart platform, wall mount optional.", price: 420_000, auto_category: "tv_audio", brand: "LG", model: "55UP7750", condition: "nigerian_used", loc: 8, seller: 2, featured: true, attributes: { screen_size: '55"' } },
  { slug: "sample-lg-fridge-owerri", title: "LG Double Door Refrigerator — 450L", description: "Frost-free, delivery within Owerri.", price: 380_000, auto_category: "refrigerators_freezers", brand: "LG", model: "GR-B492", condition: "nigerian_used", loc: 10, seller: 2, attributes: { capacity_liters: 450 } },
  { slug: "sample-samsung-washer-aba", title: "Samsung Front Load Washing Machine — 9kg", description: "Tested working, ideal for apartments.", price: 295_000, auto_category: "home_appliances", brand: "Samsung", model: "WW90T", condition: "foreign_used", loc: 11, seller: 2, attributes: { capacity_liters: 9 } },
  { slug: "sample-binatone-generator-lagos", title: "Sumec Firman 5.5kVA Generator — Key Start", description: "Low hours, serviced carburetor.", price: 650_000, auto_category: "generators", brand: "Sumec Firman", model: "SPG 7500E2", condition: "nigerian_used", loc: 0, seller: 2, attributes: { power_kva: 5.5 } },
  { slug: "sample-inverter-solar-abuja", title: "Felicity 5kVA Inverter + 200Ah Battery Bank", description: "Home backup kit wired for lights and fans.", price: 890_000, auto_category: "inverters_batteries", brand: "Felicity", model: "5kVA Hybrid", condition: "brand_new", loc: 5, seller: 2, featured: true, attributes: { power_kva: 5, battery_capacity_ah: 200 } },
  { slug: "sample-solar-panel-kit-enugu", title: "600W Solar Panel Kit with Charge Controller", description: "Monocrystalline panels with mounting brackets.", price: 480_000, auto_category: "solar_equipment", brand: "Luminous", model: "600W Starter Kit", condition: "brand_new", loc: 9, seller: 2, attributes: { power_kva: 0.6 } },
  { slug: "sample-sony-camera-lagos", title: "Sony Alpha a6400 Mirrorless Camera", description: "Body only, shutter count 8k.", price: 720_000, auto_category: "cameras", brand: "Sony", model: "Alpha a6400", condition: "foreign_used", loc: 4, seller: 2, attributes: { warranty_months: 3 } },
  { slug: "sample-tecno-spark-20-kano", title: "Tecno Spark 20 — 256GB", description: "Brand new sealed with 13-month warranty.", price: 185_000, auto_category: "phones_tablets", brand: "Tecno", model: "Spark 20", condition: "brand_new", loc: 12, seller: 2, attributes: { storage_gb: 256, ram_gb: 8 } },
  { slug: "sample-ipad-air-abuja", title: "Apple iPad Air M1 — 64GB WiFi", description: "Light cosmetic wear, battery health 91%.", price: 480_000, auto_category: "phones_tablets", brand: "Apple", model: "iPad Air", condition: "foreign_used", loc: 6, seller: 2, attributes: { storage_gb: 64 } },
  { slug: "sample-dell-latitude-lagos", title: "Dell Latitude 5420 — Core i5", description: "Business laptop with fingerprint reader.", price: 385_000, auto_category: "computers", brand: "Dell", model: "Latitude 5420", condition: "refurbished", loc: 1, seller: 2, attributes: { ram_gb: 16, storage_gb: 256 } },
  { slug: "sample-macbook-air-m2", title: "Apple MacBook Air M2 — 256GB", description: "Midnight color, cycle count 120.", price: 980_000, auto_category: "computers", brand: "Apple", model: "MacBook Air M2", condition: "foreign_used", loc: 0, seller: 2, featured: true, attributes: { storage_gb: 256, ram_gb: 8 } },
  { slug: "sample-samsung-65-tv-ibadan", title: "Samsung 65\" Crystal UHD TV", description: "Smart TV with voice assistant.", price: 620_000, auto_category: "tv_audio", brand: "Samsung", model: "AU8000", condition: "brand_new", loc: 13, seller: 2, attributes: { screen_size: '65"' } },
  { slug: "sample-jbl-soundbar-ph", title: "JBL 3.1 Channel Soundbar", description: "Wireless subwoofer, HDMI ARC.", price: 210_000, auto_category: "tv_audio", brand: "JBL", model: "Bar 3.1", condition: "brand_new", loc: 8, seller: 2, attributes: { warranty_months: 12 } },
  { slug: "sample-hisense-fridge-kaduna", title: "Hisense Single Door Fridge — 150L", description: "Compact fridge for shops and bedsitters.", price: 145_000, auto_category: "refrigerators_freezers", brand: "Hisense", model: "RS156", condition: "brand_new", loc: 16, seller: 2, attributes: { capacity_liters: 150 } },
  { slug: "sample-midea-microwave-enugu", title: "Midea Microwave Oven — 20L", description: "Grill function, barely used.", price: 68_000, auto_category: "home_appliances", brand: "Midea", model: "MM720", condition: "nigerian_used", loc: 9, seller: 2, attributes: { capacity_liters: 20 } },
  { slug: "sample-lutian-generator-5kva", title: "Lutian 5.0kVA Generator", description: "Copper coil, manual and electric start.", price: 580_000, auto_category: "generators", brand: "Lutian", model: "LT6500", condition: "brand_new", loc: 14, seller: 2, attributes: { power_kva: 5 } },
  { slug: "sample-sukam-inverter-3kva", title: "Su-Kam 3.5kVA Inverter System", description: "Includes 150Ah battery.", price: 520_000, auto_category: "inverters_batteries", brand: "Su-Kam", model: "3.5kVA", condition: "refurbished", loc: 2, seller: 2, attributes: { power_kva: 3.5, battery_capacity_ah: 150 } },
  { slug: "sample-solar-hybrid-uyo", title: "1.2kW Solar Hybrid Inverter Kit", description: "Panels + inverter for small office.", price: 750_000, auto_category: "solar_equipment", brand: "Growatt", model: "1.2kW Hybrid", condition: "brand_new", loc: 19, seller: 2, attributes: { power_kva: 1.2 } },
  { slug: "sample-canon-dslr-lagos", title: "Canon EOS 90D DSLR Kit", description: "18-135mm lens, two batteries.", price: 640_000, auto_category: "cameras", brand: "Canon", model: "EOS 90D", condition: "foreign_used", loc: 3, seller: 2, attributes: { warranty_months: 0 } },
  { slug: "sample-ps5-console-abuja", title: "Sony PlayStation 5 — Disc Edition", description: "Two controllers, FIFA 24 included.", price: 580_000, auto_category: "gaming", brand: "Sony", model: "PlayStation 5", condition: "foreign_used", loc: 5, seller: 2, featured: true, attributes: { storage_gb: 825 } },
  { slug: "sample-xbox-series-s", title: "Microsoft Xbox Series S", description: "512GB digital edition with Game Pass trial.", price: 320_000, auto_category: "gaming", brand: "Microsoft", model: "Xbox Series S", condition: "brand_new", loc: 7, seller: 2, attributes: { storage_gb: 512 } },
  { slug: "sample-redmi-note-13", title: "Xiaomi Redmi Note 13 Pro — 256GB", description: "Nigerian warranty, dual SIM.", price: 295_000, auto_category: "phones_tablets", brand: "Xiaomi", model: "Redmi Note 13 Pro", condition: "brand_new", loc: 18, seller: 2, attributes: { storage_gb: 256, ram_gb: 8 } },
  { slug: "sample-hp-monitor-27", title: "HP 27\" IPS Monitor", description: "1080p office monitor with HDMI.", price: 125_000, auto_category: "computers", brand: "HP", model: "P27 G5", condition: "brand_new", loc: 0, seller: 2, attributes: { screen_size: '27"' } },
  { slug: "sample-bluetooth-earbuds", title: "Samsung Galaxy Buds2 Pro", description: "Active noise cancellation, case included.", price: 95_000, auto_category: "other_electronics", brand: "Samsung", model: "Galaxy Buds2 Pro", condition: "foreign_used", loc: 1, seller: 2, attributes: { warranty_months: 6 } },
  { slug: "sample-cctv-4camera-kit", title: "4-Camera CCTV Kit — 1080p", description: "DVR, night vision, mobile app viewing.", price: 185_000, auto_category: "cameras", brand: "Hikvision", model: "4-Cam DVR Kit", condition: "brand_new", loc: 11, seller: 2, attributes: { warranty_months: 12 } },
  { slug: "sample-router-starlink", title: "Starlink Mini Router Kit", description: "Portable satellite internet kit for remote sites.", price: 650_000, auto_category: "other_electronics", brand: "Starlink", model: "Mini Kit", condition: "brand_new", loc: 4, seller: 2, attributes: { warranty_months: 12 } },
  { slug: "sample-nexus-blender", title: "Binatone Blender & Food Processor", description: "1.5L jar, multiple speed settings.", price: 42_000, auto_category: "home_appliances", brand: "Binatone", model: "BLG-595", condition: "brand_new", loc: 17, seller: 2, attributes: { capacity_liters: 1.5 } },
];

function assertCounts() {
  if (PROPERTY_SPECS.length !== 30) throw new Error(`property count ${PROPERTY_SPECS.length}`);
  if (VEHICLE_SPECS.length !== 30) throw new Error(`vehicle count ${VEHICLE_SPECS.length}`);
  if (ELECTRONICS_SPECS.length !== 30) throw new Error(`electronics count ${ELECTRONICS_SPECS.length}`);
}

assertCounts();

const outPath = join(process.cwd(), "src/lib/sample-listings/catalog-listings.generated.ts");

const ts = `/** AUTO-GENERATED — run: npx tsx scripts/generate-ninety-sample-catalog.ts */
import type { SampleElectronicsDef, SamplePropertyDef, SampleVehicleDef } from "./catalog-types";
import {
  SAMPLE_ELECTRONICS_PHOTOS,
  SAMPLE_PROPERTY_PHOTOS,
  SAMPLE_SELLERS,
  SAMPLE_VEHICLE_PHOTOS,
  pickPhotos,
  sampleListingId,
} from "./catalog-shared";

const LOCATIONS = ${JSON.stringify(LOCATIONS, null, 2)} as const;

function loc(i: number) {
  return LOCATIONS[i]!;
}

export const SAMPLE_PROPERTIES: SamplePropertyDef[] = [
${PROPERTY_SPECS.map((p, i) => {
  const L = LOCATIONS[p.loc]!;
  return `  {
    id: sampleListingId(${i + 1}),
    slug: ${JSON.stringify(p.slug)},
    sellerId: SAMPLE_SELLERS[${p.seller}].id,
    title: ${JSON.stringify(p.title)},
    description: ${JSON.stringify(p.description)},
    listing_type: ${JSON.stringify(p.listing_type)},
    property_type: ${JSON.stringify(p.property_type)},
    bedrooms: ${p.bedrooms},
    bathrooms: ${p.bathrooms},
    price: ${p.price},
    payment_period: ${JSON.stringify(p.payment_period)},
    state: ${JSON.stringify(L.state)},
    city: ${JSON.stringify(L.city)},
    area: ${JSON.stringify(L.area)},
${p.featured ? "    featured: true,\n" : ""}    images: pickPhotos(SAMPLE_PROPERTY_PHOTOS, ${i}, 3),
  },`;
}).join("\n")}
];

export const SAMPLE_VEHICLES: SampleVehicleDef[] = [
${VEHICLE_SPECS.map((v, i) => {
  const L = LOCATIONS[v.loc]!;
  const attrsLine = v.attributes
    ? `\n    attributes: ${JSON.stringify(v.attributes)},`
    : "";
  return `  {
    id: sampleListingId(${31 + i}),
    slug: ${JSON.stringify(v.slug)},
    sellerId: SAMPLE_SELLERS[${v.seller}].id,
    title: ${JSON.stringify(v.title)},
    description: ${JSON.stringify(v.description)},
    price: ${v.price},
    state: ${JSON.stringify(L.state)},
    city: ${JSON.stringify(L.city)},
    area: ${JSON.stringify(L.area)},
    auto_category: ${JSON.stringify(v.auto_category)},
    make: ${JSON.stringify(v.make)},
    model: ${JSON.stringify(v.model)},
    year: ${v.year},${v.transmission ? `\n    transmission: ${JSON.stringify(v.transmission)},` : ""}${v.fuel_type ? `\n    fuel_type: ${JSON.stringify(v.fuel_type)},` : ""}${v.mileage != null ? `\n    mileage: ${v.mileage},` : ""}
    vehicle_condition: ${JSON.stringify(v.vehicle_condition)},
${v.featured ? "    featured: true,\n" : ""}    images: pickPhotos(SAMPLE_VEHICLE_PHOTOS, ${i}, 3),${attrsLine}
  },`;
}).join("\n")}
];

export const SAMPLE_ELECTRONICS: SampleElectronicsDef[] = [
${ELECTRONICS_SPECS.map((e, i) => {
  const L = LOCATIONS[e.loc]!;
  return `  {
    id: sampleListingId(${61 + i}),
    slug: ${JSON.stringify(e.slug)},
    sellerId: SAMPLE_SELLERS[${e.seller}].id,
    title: ${JSON.stringify(e.title)},
    description: ${JSON.stringify(e.description)},
    price: ${e.price},
    state: ${JSON.stringify(L.state)},
    city: ${JSON.stringify(L.city)},
    area: ${JSON.stringify(L.area)},
    auto_category: ${JSON.stringify(e.auto_category)},
    brand: ${JSON.stringify(e.brand)},
    model: ${JSON.stringify(e.model)},
    condition: ${JSON.stringify(e.condition)},
${e.featured ? "    featured: true,\n" : ""}    images: pickPhotos(SAMPLE_ELECTRONICS_PHOTOS, ${i}, 2),
    attributes: ${JSON.stringify(e.attributes)},
  },`;
}).join("\n")}
];
`;

writeFileSync(outPath, ts);
console.log(`Wrote ${outPath}`);
console.log(`Counts: property ${PROPERTY_SPECS.length}, vehicle ${VEHICLE_SPECS.length}, electronics ${ELECTRONICS_SPECS.length}`);
