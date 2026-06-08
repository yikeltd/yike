import type { Metadata, Viewport } from "next";
import { brand, colors, crewBrand } from "@/lib/design/tokens";
import { STAFF_APP_MANIFEST_PATH } from "@/lib/admin/staff-app";

export const metadata: Metadata = {
  title: crewBrand.name,
  description: "Yike Crew — internal operations for Yike staff",
  applicationName: crewBrand.name,
  manifest: STAFF_APP_MANIFEST_PATH,
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: crewBrand.name,
  },
  icons: {
    icon: [
      { url: crewBrand.icon192Png, sizes: "192x192", type: "image/png" },
      { url: crewBrand.icon512Png, sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: crewBrand.icon192Png, sizes: "192x192", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: colors.navy,
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function StaffAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-staff-app="true" className="min-h-[100dvh] bg-navy text-white">
      <div className="sr-only">{brand.name} {crewBrand.name}</div>
      {children}
    </div>
  );
}
