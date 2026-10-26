/**
 * Shared assets for the 90-listing sample catalog (30 property · 30 vehicle · 30 electronics).
 */

export const SAMPLE_LISTINGS_NAMESPACE = "yike-sample-listings-v2-90";

const u = (photoId: string) =>
  `https://images.unsplash.com/${photoId}?w=1200&q=80&auto=format&fit=crop`;

export const SAMPLE_PROPERTY_PHOTOS = [
  u("photo-1560448204-e02f11c3d0e2"),
  u("photo-1522708323590-d24dbb6b0267"),
  u("photo-1600596542815-ffad4c1539a9"),
  u("photo-1600585154340-be6161a56a0c"),
  u("photo-1605276374101-de9d87824847"),
  u("photo-1600607687939-ce8a6c25118c"),
  u("photo-1502672260266-1c1ef2d93688"),
  u("photo-1570129477492-45c003edd2be"),
  u("photo-1564013799919-ab600027ffc6"),
  u("photo-1600566753190-17f0baa5a365"),
  u("photo-1600047509807-ba8f99d2d7de"),
  u("photo-1600607687644-c7171b42498f"),
];

export const SAMPLE_VEHICLE_PHOTOS = [
  u("photo-1492144534655-ae79c964c9d7"),
  u("photo-1503376780353-7e6692767b70"),
  u("photo-1552519507-da3b142c6e3d"),
  u("photo-1549317661-bd32c8ce0db2"),
  u("photo-1519641471654-76ce0107ad1b"),
  u("photo-1606664515524-ed2f786a0bd6"),
  u("photo-1617814076367-b759c7d7e738"),
  u("photo-1618843479313-40f8afb4b4d8"),
  u("photo-1558981806-ec527fa84c39"),
  u("photo-1601584115197-04ecc0da31d7"),
  u("photo-1621007947382-b76b334c4a82"),
  u("photo-1605559424843-9e4c228bf1d2"),
];

export const SAMPLE_ELECTRONICS_PHOTOS = [
  u("photo-1511707171634-5f897ff02aa9"),
  u("photo-1496181133206-80ce9b88a853"),
  u("photo-1593359677878-a671bb2352b2"),
  u("photo-1571175444760-106ad178c1af"),
  u("photo-1581091226825-a6a2a5aee158"),
  u("photo-1509391366360-2e959784a276"),
  u("photo-1601597111158-2fceff292db9"),
  u("photo-1558618666-fcd25c85cd64"),
  u("photo-1621905252507-b35492cc74b5"),
  u("photo-1613665813447-7a0fb6a2c821"),
  u("photo-1593640408182-31c70c7458ad"),
  u("photo-1606144042614-b2417e99c4e9"),
];

export type SampleSellerDef = {
  id: string;
  email: string;
  full_name: string;
  phone: string;
};

export const SAMPLE_SELLERS: SampleSellerDef[] = [
  {
    id: "s1000001-0000-4000-8000-000000000001",
    email: "sample.properties@yike.demo",
    full_name: "Sample Properties NG",
    phone: "08030001001",
  },
  {
    id: "s1000001-0000-4000-8000-000000000002",
    email: "sample.vehicles@yike.demo",
    full_name: "Sample Motors NG",
    phone: "08030001002",
  },
  {
    id: "s1000001-0000-4000-8000-000000000003",
    email: "sample.electronics@yike.demo",
    full_name: "Sample Gadgets & Power",
    phone: "08030001003",
  },
];

/** Stable listing id for catalog index 1–90 (property 1–30, vehicle 31–60, electronics 61–90). */
export function sampleListingId(index: number): string {
  if (index < 1 || index > 90) {
    throw new Error(`sample listing index out of range: ${index}`);
  }
  return `s3000001-0000-4000-8000-${String(index).padStart(12, "0")}`;
}

export function pickPhotos(pool: string[], start: number, count = 3): string[] {
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    out.push(pool[(start + i) % pool.length]!);
  }
  return out;
}
