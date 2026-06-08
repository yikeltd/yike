import type { Metadata, Viewport } from "next";
import { brand, colors } from "@/lib/design/tokens";
import { STAFF_APP_MANIFEST_PATH } from "@/lib/admin/staff-app";

export const metadata: Metadata = {
  title: "Yike Staff",
  description: "Yike internal operations — staff only",
  applicationName: "Yike Staff",
  manifest: STAFF_APP_MANIFEST_PATH,
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Yike Staff",
  },
  icons: {
    icon: [{ url: "/icons/android-chrome-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
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
      <div className="sr-only">{brand.name} Staff Operations</div>
      {children}
    </div>
  );
}
