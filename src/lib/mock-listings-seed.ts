import type {
  ListingExtras,
  ListingType,
  PaymentPeriod,
  Profile,
  Property,
} from "@/types/database";
import { getAreaProfiles } from "@/constants/areaProfiles";
import { isLandPropertyType } from "@/constants/listingTypes";
import { generateSupplementalSeeds } from "@/lib/mock-listings-generate";

const IMG = (id: string) =>
  `https://images.unsplash.com/${id}?w=1200&q=82&auto=format&fit=crop&crop=entropy`;

/** Diverse interiors, exteriors, modest & premium — reduces repetitive feed feel */
const PHOTOS = [
  IMG("photo-1560448204-e02f11c3d0e2"), // living room
  IMG("photo-1522708323590-d24dbb6b0267"), // compact flat
  IMG("photo-1600596542815-ffad4c1539a9"), // modern house exterior
  IMG("photo-1502672260266-1c1ef2d93688"), // furnished shortlet
  IMG("photo-1600585154340-be6161a56a0c"), // suburban home
  IMG("photo-1605276374101-de9d87824847"), // bungalow
  IMG("photo-1600607687939-ce8a6c25118c"), // luxury interior
  IMG("photo-1600566753190-17f0baa5a365"), // pool estate
  IMG("photo-1600047509807-ba8f8d28b018"), // bright kitchen
  IMG("photo-1600210492486-724fe9c0fb0f"), // bedroom
  IMG("photo-1600585154526-990dced4db0d"), // terrace
  IMG("photo-1493809842364-78817add7ffb"), // loft
  IMG("photo-1484154218962-a197022b5858"), // cozy apartment
  IMG("photo-1570129477492-45c003edd2be"), // family home
  IMG("photo-1600585152915-d0bec72a7e9c"), // modern villa
  IMG("photo-1600607687644-c7171b42498f"), // bathroom ensuite
  IMG("photo-1564013799919-ab600027ffc6"), // classic house
  IMG("photo-1512917774080-9991f1c4c750"), // contemporary exterior
  IMG("photo-1600047509354-9f597a6d0b8e"), // minimalist room
  IMG("photo-1568605114967-a871f508b75c"), // dining / kitchen
  IMG("photo-1583608205774-aeff4f05ce63"), // bedroom simple
  IMG("photo-1576941089067-44de08032a21"), // apartment exterior
  IMG("photo-1616598332001-f8e1d8c0e0e0"), // compact studio
  IMG("photo-1605146769289-2201137423ff"), // townhouse street
];

function photoForSeed(s: Seed, index: number): number {
  const salt = s.id.split("-").pop() ?? "0";
  return (s.photo + Number(salt) + index) % PHOTOS.length;
}

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86400000).toISOString();
}

function mockAgent(
  partial: Pick<Profile, "id" | "full_name" | "phone" | "agent_type" | "trust_score"> &
    Partial<Profile>
): Profile {
  return {
    username: null,
    email: null,
    phone_verified: true,
    email_verified: true,
    whatsapp: partial.phone,
    avatar_url: null,
    role: "agent",
    verification_status: "approved",
    is_banned: false,
    created_at: "2025-01-01",
    ...partial,
  };
}

const AGENTS: Profile[] = [
  mockAgent({ id: "ag-1", full_name: "Chioma Okonkwo", phone: "08031234567", agent_type: "independent", trust_score: 98 }),
  mockAgent({ id: "ag-2", full_name: "Emeka Nwosu", phone: "08098765432", agent_type: "agency", trust_score: 96 }),
  mockAgent({ id: "ag-3", full_name: "Ada Enugu Properties", phone: "08123456789", agent_type: "agency", trust_score: 99 }),
  mockAgent({ id: "ag-4", full_name: "Owerri Stays", phone: "07087654321", agent_type: "landlord", trust_score: 94 }),
  mockAgent({ id: "ag-5", full_name: "Blessing Ude", phone: "08055667788", agent_type: "independent", trust_score: 92 }),
  mockAgent({ id: "ag-6", full_name: "Lekki Homes NG", phone: "08112233445", agent_type: "agency", trust_score: 97 }),
  mockAgent({ id: "ag-7", full_name: "Abuja Prime Realty", phone: "09087654321", agent_type: "agency", trust_score: 100 }),
  mockAgent({ id: "ag-8", full_name: "PH City Agents", phone: "08033445566", agent_type: "independent", trust_score: 91 }),
  mockAgent({ id: "ag-9", full_name: "Yaba Student Lets", phone: "07011223344", agent_type: "landlord", trust_score: 88 }),
  mockAgent({ id: "ag-10", full_name: "Kano Property Hub", phone: "08099887766", agent_type: "agency", trust_score: 93 }),
  mockAgent({ id: "ag-11", full_name: "Uyo Homes", phone: "08166778899", agent_type: "independent", trust_score: 90 }),
  mockAgent({ id: "ag-12", full_name: "Ibadan Living", phone: "08077665544", agent_type: "agency", trust_score: 95 }),
];

type Seed = {
  id: string;
  state: string;
  city: string;
  area: string;
  title: string;
  description: string;
  listing_type: ListingType;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  price: number;
  payment_period: PaymentPeriod;
  featured?: boolean;
  verified?: boolean;
  landmark?: string;
  photo: number;
  agent: number;
  extraPhotos?: number[];
};

const expires = new Date(Date.now() + 14 * 86400000).toISOString();

const SEEDS: Seed[] = [
  // ABIA — underserved emphasis
  { id: "demo-1", state: "Abia", city: "Aba", area: "Ogbor Hill", title: "2-bed flat — Ogbor Hill", description: "Spacious flat in gated estate. POP ceiling, tiled floors, prepaid meter, 24hr security. 5 mins to Abia Poly.", listing_type: "rent", property_type: "flat", bedrooms: 2, bathrooms: 2, price: 850000, payment_period: "yearly", featured: true, verified: true, landmark: "Near Abia Poly", photo: 0, agent: 0 },
  { id: "demo-2", state: "Abia", city: "Aba", area: "World Bank", title: "Self contain — World Bank", description: "Clean self contain, own bathroom, kitchenette. Close to main road. Ideal for young professionals.", listing_type: "rent", property_type: "self_contain", bedrooms: 1, bathrooms: 1, price: 350000, payment_period: "yearly", verified: true, photo: 1, agent: 1 },
  { id: "demo-3", state: "Abia", city: "Aba", area: "Ariaria", title: "Mini flat — Ariaria market road", description: "Affordable mini flat, good for singles. Running water, fenced compound.", listing_type: "rent", property_type: "mini_flat", bedrooms: 1, bathrooms: 1, price: 420000, payment_period: "yearly", verified: true, photo: 4, agent: 4 },
  { id: "demo-4", state: "Abia", city: "Aba", area: "Faulks Road", title: "Room and parlour — Faulks Road", description: "Neat room and parlour, tiled, borehole water. Quiet street.", listing_type: "rent", property_type: "room", bedrooms: 1, bathrooms: 1, price: 280000, payment_period: "yearly", photo: 1, agent: 4 },
  { id: "demo-5", state: "Abia", city: "Aba", area: "Osisioma", title: "3-bed bungalow — Osisioma", description: "Family bungalow with compound parking. Good road network.", listing_type: "rent", property_type: "bungalow", bedrooms: 3, bathrooms: 2, price: 750000, payment_period: "yearly", photo: 5, agent: 1 },
  { id: "demo-6", state: "Abia", city: "Aba", area: "Umungasi", title: "Face-me-I-face-you room — Umungasi", description: "Single room in face-me-I-face-you. Shared kitchen. Budget-friendly.", listing_type: "rent", property_type: "room", bedrooms: 1, bathrooms: 1, price: 180000, payment_period: "yearly", photo: 1, agent: 4 },
  // ENUGU
  { id: "demo-7", state: "Enugu", city: "Enugu", area: "New Haven", title: "3-bed duplex — New Haven", description: "Family duplex with compound and borehole. Close to Shoprite.", listing_type: "rent", property_type: "duplex", bedrooms: 3, bathrooms: 3, price: 1800000, payment_period: "yearly", featured: true, photo: 2, agent: 2 },
  { id: "demo-8", state: "Enugu", city: "Enugu", area: "GRA", title: "4-bed bungalow for sale — GRA", description: "Detached bungalow on half plot. C of O available. Serene GRA.", listing_type: "sale", property_type: "bungalow", bedrooms: 4, bathrooms: 3, price: 45000000, payment_period: "total", featured: true, verified: true, photo: 5, agent: 2 },
  { id: "demo-9", state: "Enugu", city: "Enugu", area: "Independence Layout", title: "2-bed flat — Independence Layout", description: "Serviced flat near UNN gate. Generator, security, parking.", listing_type: "rent", property_type: "flat", bedrooms: 2, bathrooms: 2, price: 1200000, payment_period: "yearly", verified: true, photo: 0, agent: 2 },
  { id: "demo-10", state: "Enugu", city: "Enugu", area: "Trans Ekulu", title: "Self contain — Trans Ekulu", description: "Newly painted self contain. Tarred road, steady light.", listing_type: "rent", property_type: "self_contain", bedrooms: 1, bathrooms: 1, price: 400000, payment_period: "yearly", photo: 1, agent: 2 },
  // OWERRI
  { id: "demo-11", state: "Imo", city: "Owerri", area: "Ikenegbu", title: "Serviced shortlet — Ikenegbu", description: "Fully furnished shortlet. WiFi, AC, smart TV. Nightly or weekly stays.", listing_type: "shortlet", property_type: "flat", bedrooms: 2, bathrooms: 2, price: 35000, payment_period: "daily", verified: true, photo: 3, agent: 3 },
  { id: "demo-12", state: "Imo", city: "Owerri", area: "Nekede", title: "Student self contain — Nekede", description: "Walking distance to FUTO. Secure compound, affordable.", listing_type: "rent", property_type: "self_contain", bedrooms: 1, bathrooms: 1, price: 250000, payment_period: "yearly", photo: 1, agent: 3 },
  { id: "demo-13", state: "Imo", city: "Owerri", area: "Aladinma", title: "3-bed flat — Aladinma", description: "Spacious flat, POP, wardrobes, kitchen cabinets.", listing_type: "rent", property_type: "flat", bedrooms: 3, bathrooms: 2, price: 900000, payment_period: "yearly", photo: 0, agent: 3 },
  // LAGOS — premium mix
  { id: "demo-14", state: "Lagos", city: "Lagos", area: "Lekki", title: "4-bed terrace — Lekki Phase 1", description: "Serviced terrace in secure estate. Gym, pool, 24hr power.", listing_type: "rent", property_type: "duplex", bedrooms: 4, bathrooms: 4, price: 8500000, payment_period: "yearly", featured: true, verified: true, photo: 6, agent: 5, extraPhotos: [7, 8] },
  { id: "demo-15", state: "Lagos", city: "Lagos", area: "Chevron", title: "3-bed flat — Chevron Drive", description: "Luxury flat with sea breeze. Fitted kitchen, en-suite rooms.", listing_type: "rent", property_type: "flat", bedrooms: 3, bathrooms: 3, price: 6000000, payment_period: "yearly", featured: true, photo: 6, agent: 5 },
  { id: "demo-16", state: "Lagos", city: "Lagos", area: "Yaba", title: "Self contain — Yaba Akoka", description: "Near UNILAG. Ideal for students. Prepaid meter.", listing_type: "rent", property_type: "self_contain", bedrooms: 1, bathrooms: 1, price: 450000, payment_period: "yearly", verified: true, photo: 1, agent: 8 },
  { id: "demo-17", state: "Lagos", city: "Lagos", area: "Surulere", title: "2-bed flat — Surulere", description: "Close to National Stadium. Good road, parking space.", listing_type: "rent", property_type: "flat", bedrooms: 2, bathrooms: 2, price: 1500000, payment_period: "yearly", photo: 0, agent: 5 },
  { id: "demo-18", state: "Lagos", city: "Lagos", area: "Ikeja", title: "Mini flat — Ikeja GRA", description: "Quiet GRA street. 10 mins to airport. Fenced compound.", listing_type: "rent", property_type: "mini_flat", bedrooms: 1, bathrooms: 1, price: 900000, payment_period: "yearly", photo: 4, agent: 5 },
  { id: "demo-19", state: "Lagos", city: "Lagos", area: "Victoria Island", title: "Luxury 3-bed — Victoria Island", description: "High-rise apartment with concierge. Ocean view balcony.", listing_type: "rent", property_type: "flat", bedrooms: 3, bathrooms: 3, price: 12000000, payment_period: "yearly", featured: true, verified: true, photo: 7, agent: 5 },
  { id: "demo-20", state: "Lagos", city: "Lagos", area: "Ajah", title: "2-bed flat — Sangotedo Ajah", description: "New development on Lekki-Epe express. Estate security.", listing_type: "rent", property_type: "flat", bedrooms: 2, bathrooms: 2, price: 2200000, payment_period: "yearly", photo: 0, agent: 5 },
  { id: "demo-21", state: "Lagos", city: "Lagos", area: "Gbagada", title: "Room and parlour — Gbagada", description: "Affordable family option. Close to Third Mainland.", listing_type: "rent", property_type: "room", bedrooms: 1, bathrooms: 1, price: 700000, payment_period: "yearly", photo: 1, agent: 5 },
  { id: "demo-22", state: "Lagos", city: "Lagos", area: "Festac", title: "3-bed flat — Festac Town", description: "Spacious Festac flat. Boys quarters available.", listing_type: "rent", property_type: "flat", bedrooms: 3, bathrooms: 2, price: 1800000, payment_period: "yearly", photo: 0, agent: 5 },
  { id: "demo-23", state: "Lagos", city: "Lagos", area: "Ikoyi", title: "Shortlet apartment — Ikoyi", description: "Serviced apartment for executives. Daily housekeeping.", listing_type: "shortlet", property_type: "flat", bedrooms: 2, bathrooms: 2, price: 85000, payment_period: "daily", featured: true, photo: 3, agent: 5 },
  { id: "demo-24", state: "Lagos", city: "Lagos", area: "Maryland", title: "Self contain — Maryland", description: "Compact self contain near Maryland Mall.", listing_type: "rent", property_type: "self_contain", bedrooms: 1, bathrooms: 1, price: 550000, payment_period: "yearly", photo: 1, agent: 5 },
  // ABUJA
  { id: "demo-25", state: "FCT", city: "Abuja", area: "Wuse 2", title: "2-bed flat — Wuse 2", description: "Central Abuja location. Restaurants and offices nearby.", listing_type: "rent", property_type: "flat", bedrooms: 2, bathrooms: 2, price: 3500000, payment_period: "yearly", featured: true, verified: true, photo: 0, agent: 6 },
  { id: "demo-26", state: "FCT", city: "Abuja", area: "Maitama", title: "5-bed duplex — Maitama", description: "Diplomatic zone. Massive compound, BQ, generator.", listing_type: "rent", property_type: "duplex", bedrooms: 5, bathrooms: 5, price: 15000000, payment_period: "yearly", featured: true, photo: 6, agent: 6 },
  { id: "demo-27", state: "FCT", city: "Abuja", area: "Gwarinpa", title: "3-bed flat — Gwarinpa", description: "Popular family estate. Good schools nearby.", listing_type: "rent", property_type: "flat", bedrooms: 3, bathrooms: 2, price: 2200000, payment_period: "yearly", photo: 0, agent: 6 },
  { id: "demo-28", state: "FCT", city: "Abuja", area: "Lugbe", title: "Self contain — Lugbe", description: "Affordable Abuja option. Tarred road, borehole.", listing_type: "rent", property_type: "self_contain", bedrooms: 1, bathrooms: 1, price: 450000, payment_period: "yearly", verified: true, photo: 1, agent: 6 },
  { id: "demo-29", state: "FCT", city: "Abuja", area: "Kubwa", title: "2-bed flat — Kubwa", description: "Spacious flat in Kubwa Phase 4. Steady light.", listing_type: "rent", property_type: "flat", bedrooms: 2, bathrooms: 2, price: 800000, payment_period: "yearly", photo: 0, agent: 6 },
  { id: "demo-30", state: "FCT", city: "Abuja", area: "Asokoro", title: "4-bed for sale — Asokoro", description: "Premium Asokoro residence. Fully detached.", listing_type: "sale", property_type: "bungalow", bedrooms: 4, bathrooms: 4, price: 280000000, payment_period: "total", featured: true, photo: 5, agent: 6 },
  // PORT HARCOURT
  { id: "demo-31", state: "Rivers", city: "Port Harcourt", area: "GRA", title: "3-bed flat — PH GRA", description: "Quiet GRA street. Ideal for expats and professionals.", listing_type: "rent", property_type: "flat", bedrooms: 3, bathrooms: 2, price: 2800000, payment_period: "yearly", featured: true, verified: true, photo: 0, agent: 7 },
  { id: "demo-32", state: "Rivers", city: "Port Harcourt", area: "Woji", title: "Mini flat — Woji", description: "Newly built mini flat. Close to Woji market.", listing_type: "rent", property_type: "mini_flat", bedrooms: 1, bathrooms: 1, price: 600000, payment_period: "yearly", photo: 4, agent: 7 },
  { id: "demo-33", state: "Rivers", city: "Port Harcourt", area: "Choba", title: "Student flat — Choba UNIPORT", description: "Walking distance to Uniport gate. Shared compound.", listing_type: "rent", property_type: "self_contain", bedrooms: 1, bathrooms: 1, price: 200000, payment_period: "yearly", photo: 1, agent: 7 },
  // UYO, ASABA, AWKA
  { id: "demo-34", state: "Akwa Ibom", city: "Uyo", area: "Ewet Housing", title: "3-bed flat — Ewet Housing", description: "Government layout. Wide roads, serene environment.", listing_type: "rent", property_type: "flat", bedrooms: 3, bathrooms: 2, price: 900000, payment_period: "yearly", verified: true, photo: 0, agent: 10 },
  { id: "demo-35", state: "Delta", city: "Asaba", area: "Core Area", title: "2-bed flat — Asaba Core Area", description: "Central Asaba. Close to Summit Road businesses.", listing_type: "rent", property_type: "flat", bedrooms: 2, bathrooms: 2, price: 750000, payment_period: "yearly", photo: 0, agent: 7 },
  { id: "demo-36", state: "Anambra", city: "Awka", area: "Ifite", title: "Self contain — Ifite Awka", description: "Near UNIZIK. Student-friendly, secure.", listing_type: "rent", property_type: "self_contain", bedrooms: 1, bathrooms: 1, price: 220000, payment_period: "yearly", photo: 1, agent: 1 },
  // BENIN, CALABAR
  { id: "demo-37", state: "Edo", city: "Benin City", area: "Ugbowo", title: "Self contain — Ugbowo UNIBEN", description: "Close to University of Benin main gate.", listing_type: "rent", property_type: "self_contain", bedrooms: 1, bathrooms: 1, price: 200000, payment_period: "yearly", photo: 1, agent: 1 },
  { id: "demo-38", state: "Edo", city: "Benin City", area: "GRA", title: "4-bed duplex — Benin GRA", description: "Executive duplex with ample parking.", listing_type: "rent", property_type: "duplex", bedrooms: 4, bathrooms: 3, price: 2200000, payment_period: "yearly", photo: 2, agent: 1 },
  { id: "demo-39", state: "Cross River", city: "Calabar", area: "Marian", title: "2-bed flat — Marian Calabar", description: "Tourist-friendly area. Quiet and green.", listing_type: "rent", property_type: "flat", bedrooms: 2, bathrooms: 2, price: 650000, payment_period: "yearly", photo: 0, agent: 10 },
  // KANO, KADUNA, IBADAN
  { id: "demo-40", state: "Kano", city: "Kano", area: "Nassarawa", title: "3-bed bungalow — Nassarawa", description: "Family home in gated street. Borehole, generator space.", listing_type: "rent", property_type: "bungalow", bedrooms: 3, bathrooms: 2, price: 900000, payment_period: "yearly", photo: 5, agent: 9 },
  { id: "demo-41", state: "Kaduna", city: "Kaduna", area: "Barnawa", title: "2-bed flat — Barnawa", description: "Premium Kaduna neighbourhood. Shops and schools close.", listing_type: "rent", property_type: "flat", bedrooms: 2, bathrooms: 2, price: 1100000, payment_period: "yearly", photo: 0, agent: 9 },
  { id: "demo-42", state: "Oyo", city: "Ibadan", area: "Bodija", title: "3-bed flat — Bodija", description: "Close to UI. Serene Bodija extension.", listing_type: "rent", property_type: "flat", bedrooms: 3, bathrooms: 2, price: 800000, payment_period: "yearly", verified: true, photo: 0, agent: 11 },
  { id: "demo-43", state: "Oyo", city: "Ibadan", area: "Akobo", title: "Self contain — Akobo", description: "Affordable Akobo self contain. Tarred access road.", listing_type: "rent", property_type: "self_contain", bedrooms: 1, bathrooms: 1, price: 300000, payment_period: "yearly", photo: 1, agent: 11 },
  // WARRI, ILORIN, ABEOKUTA, JOS, AKURE
  { id: "demo-44", state: "Delta", city: "Warri", area: "Effurun", title: "2-bed flat — Effurun", description: "Close to Warri refinery road. POP finished.", listing_type: "rent", property_type: "flat", bedrooms: 2, bathrooms: 2, price: 550000, payment_period: "yearly", photo: 0, agent: 7 },
  { id: "demo-45", state: "Kwara", city: "Ilorin", area: "Tanke", title: "Self contain — Tanke", description: "Near UNILORIN. Student area, affordable.", listing_type: "rent", property_type: "self_contain", bedrooms: 1, bathrooms: 1, price: 180000, payment_period: "yearly", photo: 1, agent: 11 },
  { id: "demo-46", state: "Ogun", city: "Abeokuta", area: "Ibara", title: "3-bed flat — Ibara", description: "GRA Ibara. Family-friendly, fenced.", listing_type: "rent", property_type: "flat", bedrooms: 3, bathrooms: 2, price: 700000, payment_period: "yearly", photo: 0, agent: 11 },
  { id: "demo-47", state: "Plateau", city: "Jos", area: "Rayfield", title: "4-bed duplex — Rayfield Jos", description: "Cool climate. Spacious duplex with garden.", listing_type: "rent", property_type: "duplex", bedrooms: 4, bathrooms: 3, price: 1500000, payment_period: "yearly", photo: 2, agent: 9 },
  { id: "demo-48", state: "Ondo", city: "Akure", area: "Alagbaka", title: "2-bed flat — Alagbaka", description: "Government reserve area. Secure and clean.", listing_type: "rent", property_type: "flat", bedrooms: 2, bathrooms: 2, price: 500000, payment_period: "yearly", photo: 0, agent: 11 },
  // MORE LAGOS + SALES
  { id: "demo-49", state: "Lagos", city: "Lagos", area: "Magodo", title: "5-bed duplex for sale — Magodo", description: "Fully detached duplex. C of O. Boys quarters.", listing_type: "sale", property_type: "duplex", bedrooms: 5, bathrooms: 5, price: 180000000, payment_period: "total", featured: true, photo: 5, agent: 5 },
  { id: "demo-50", state: "Lagos", city: "Lagos", area: "Ikorodu", title: "2-bed flat — Ikorodu", description: "Affordable Lagos option. Estate with security.", listing_type: "rent", property_type: "flat", bedrooms: 2, bathrooms: 2, price: 500000, payment_period: "yearly", photo: 0, agent: 5 },
  { id: "demo-51", state: "Rivers", city: "Port Harcourt", area: "Eliozu", title: "Shortlet — Eliozu PH", description: "Corporate shortlet. Fully serviced, WiFi, DSTV.", listing_type: "shortlet", property_type: "flat", bedrooms: 2, bathrooms: 2, price: 28000, payment_period: "daily", photo: 3, agent: 7 },
  { id: "demo-52", state: "Enugu", city: "Enugu", area: "Uwani", title: "Shop space — Uwani", description: "Ground floor shop on busy road. Good foot traffic.", listing_type: "rent", property_type: "shop", bedrooms: 0, bathrooms: 1, price: 600000, payment_period: "yearly", photo: 9, agent: 2 },
  { id: "demo-53", state: "Abia", city: "Aba", area: "Eziukwu", title: "Boys quarters — Eziukwu", description: "Standalone BQ with own meter. Compound shared.", listing_type: "rent", property_type: "room", bedrooms: 1, bathrooms: 1, price: 200000, payment_period: "yearly", photo: 1, agent: 0 },
  { id: "demo-54", state: "FCT", city: "Abuja", area: "Jahi", title: "4-bed terrace — Jahi", description: "New Jahi district. Modern finish, estate security.", listing_type: "rent", property_type: "duplex", bedrooms: 4, bathrooms: 4, price: 5500000, payment_period: "yearly", featured: true, photo: 6, agent: 6 },
  { id: "demo-55", state: "Imo", city: "Owerri", area: "World Bank", title: "Mini flat — World Bank Owerri", description: "Clean mini flat, tiled, fenced. Close to banks.", listing_type: "rent", property_type: "mini_flat", bedrooms: 1, bathrooms: 1, price: 380000, payment_period: "yearly", verified: true, photo: 4, agent: 3 },
  { id: "demo-56", state: "Lagos", city: "Lagos", area: "Ajah", title: "600sqm residential land — Ajah", description: "Dry land in gated estate. Survey plan & deed of assignment. Road access tarred.", listing_type: "sale", property_type: "land_residential", bedrooms: 0, bathrooms: 0, price: 45000000, payment_period: "total", featured: true, verified: true, photo: 17, agent: 5 },
  { id: "demo-57", state: "FCT", city: "Abuja", area: "Lugbe", title: "1 acre farm land lease — Lugbe", description: "5-year renewable lease. Perimeter fence, borehole on plot.", listing_type: "lease", property_type: "land_farm", bedrooms: 0, bathrooms: 0, price: 1200000, payment_period: "yearly", photo: 17, agent: 6 },
  { id: "demo-58", state: "Rivers", city: "Port Harcourt", area: "Eliozu", title: "Commercial land for lease — Eliozu", description: "Corner plot on main road. Ideal for petrol station or plaza.", listing_type: "lease", property_type: "land_commercial", bedrooms: 0, bathrooms: 0, price: 3500000, payment_period: "yearly", photo: 17, agent: 7 },
  { id: "demo-59", state: "Ogun", city: "Abeokuta", area: "Olomore", title: "300sqm land for sale — Olomore", description: "Registered land with C of O processing. Quiet neighbourhood.", listing_type: "sale", property_type: "land", bedrooms: 0, bathrooms: 0, price: 8500000, payment_period: "total", photo: 17, agent: 11 },
];

function buildListingExtras(s: Seed): ListingExtras {
  const amenities: string[] = [];

  if (s.listing_type === "shortlet") {
    amenities.push("furnished", "wifi", "ac", "serviced");
  }
  if (s.price <= 500_000) {
    amenities.push("prepaid_meter", "borehole", "tiled");
  } else if (s.price <= 1_500_000) {
    amenities.push("prepaid_meter", "borehole", "pop_ceiling", "tiled", "security");
  } else {
    amenities.push(
      "gated_estate",
      "security",
      "generator",
      "parking",
      "pop_ceiling",
      "tiled",
      "water_heater"
    );
  }
  if (s.bedrooms >= 3 || s.property_type === "duplex") {
    amenities.push("boys_quarters");
  }
  if (s.title.toLowerCase().includes("student")) {
    amenities.push("prepaid_meter", "borehole");
  }

  const profiles = getAreaProfiles(s.city, s.area);
  if (profiles.includes("student") && !amenities.includes("prepaid_meter")) {
    amenities.push("prepaid_meter");
  }

  const uniqueAmenities = [...new Set(amenities)];

  if (s.listing_type === "shortlet") {
    return {
      amenities: uniqueAmenities,
      cleaning_fee: s.price >= 50_000 ? 15_000 : 8_000,
      caution_deposit: s.price * 2,
    };
  }

  if (s.listing_type === "sale") {
    return { amenities: uniqueAmenities };
  }

  if (s.listing_type === "lease") {
    const agencyFee = s.price >= 3_000_000 ? 5 : 10;
    return {
      amenities: uniqueAmenities,
      agency_fee_percent: agencyFee,
      caution_months: 12,
      agreement_fee: s.price >= 1_000_000 ? 150_000 : 75_000,
      legal_fee: isLandPropertyType(s.property_type) ? 200_000 : 0,
    };
  }

  const agencyFee = s.price >= 3_000_000 ? 5 : 10;
  const cautionMonths = s.price >= 2_000_000 ? 12 : 12;
  const agreementFee = s.price >= 1_000_000 ? 100_000 : 50_000;
  const serviceCharge =
    s.price >= 2_000_000 ? Math.round(s.price * 0.08) : 0;

  return {
    amenities: uniqueAmenities,
    agency_fee_percent: agencyFee,
    caution_months: cautionMonths,
    agreement_fee: agreementFee,
    service_charge: serviceCharge,
    legal_fee: s.price >= 5_000_000 ? 150_000 : 0,
  };
}

function seedToProperty(s: Seed, views: number, index: number): Property {
  const primary = photoForSeed(s, index);
  const extras = (s.extraPhotos ?? []).map((i, j) =>
    PHOTOS[(i + index + j + 3) % PHOTOS.length]
  );
  const photos = [PHOTOS[primary], ...extras.filter((u) => u !== PHOTOS[primary])];
  const agent = AGENTS[s.agent % AGENTS.length];
  const listedDaysAgo = 1 + (index % 21);
  return {
    id: s.id,
    agent_id: agent.id,
    title: s.title,
    description: s.description,
    listing_type: s.listing_type,
    property_type: s.property_type,
    bedrooms: s.bedrooms,
    bathrooms: s.bathrooms,
    toilets: s.bathrooms,
    price: s.price,
    payment_period: s.payment_period,
    state: s.state,
    city: s.city,
    area: s.area,
    address_hint: null,
    landmark: s.landmark ?? null,
    media_urls: photos,
    video_url: null,
    status: "approved",
    is_featured: s.featured ?? false,
    is_verified_listing: s.verified ?? false,
    views_count: views,
    contact_clicks: Math.floor(views * 0.12),
    expires_at: expires,
    created_at: daysAgo(listedDaysAgo + 2),
    updated_at: daysAgo(listedDaysAgo),
    extras: buildListingExtras(s),
    agent,
  };
}

const TARGET_LISTING_COUNT = 250;

function allSeeds(): Seed[] {
  const keys = new Set(
    SEEDS.map(
      (s) =>
        `${s.city}|${s.area}|${s.property_type}|${s.bedrooms}|${s.listing_type}`
    )
  );
  const supplemental = generateSupplementalSeeds(
    keys,
    SEEDS.length + 1,
    TARGET_LISTING_COUNT
  );
  return [...SEEDS, ...supplemental];
}

export function buildMockListings(): Property[] {
  const seeds = allSeeds();
  return seeds.map((s, i) => seedToProperty(s, 45 + i * 7, i));
}
