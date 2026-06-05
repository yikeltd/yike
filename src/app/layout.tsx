import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/constants";
import { brand, colors } from "@/lib/design/tokens";
import { StructuredData } from "@/components/seo/structured-data";
import { PwaRegister } from "@/components/pwa/register";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const ogImage = `${SITE_URL}/images/logo.webp`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Find Real Houses in Nigeria`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_TAGLINE,
  keywords: [
    "houses for rent Nigeria",
    "property Nigeria",
    "Aba rent",
    "Enugu apartments",
    "Owerri housing",
    "verified agents",
    "Yike",
  ],
  applicationName: SITE_NAME,
  authors: [{ name: brand.name, url: SITE_URL }],
  creator: brand.name,
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: SITE_NAME,
  },
  icons: {
    icon: [{ url: "/favicon.ico" }, { url: "/icons/icon-32.png", sizes: "32x32" }],
    apple: "/apple-touch-icon.png",
  },
  formatDetection: { telephone: true },
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Nigerian Housing Marketplace`,
    description: SITE_TAGLINE,
    images: [{ url: ogImage, width: 512, height: 512, alt: "Yike logo" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@real_yike",
    title: `${SITE_NAME} — Find Real Houses in Nigeria`,
    description: SITE_TAGLINE,
    images: [ogImage],
  },
  manifest: "/manifest.json",
  alternates: { canonical: SITE_URL },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: colors.navy },
    { media: "(prefers-color-scheme: dark)", color: colors.navyDark },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased">
        <StructuredData />
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
