import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/constants";
import { brand, colors } from "@/lib/design/tokens";
import { StructuredData } from "@/components/seo/structured-data";
import { PwaRegister } from "@/components/pwa/register";
import { PwaInstallPrompt } from "@/components/pwa/install-prompt";
import { Analytics } from "@vercel/analytics/react";
import { Suspense } from "react";
import { AnalyticsProvider } from "@/components/analytics/analytics-provider";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ScrollRetention } from "@/components/retention/scroll-retention";
import { GuestFavoriteSync } from "@/components/retention/guest-favorite-sync";
import { AuthProvider } from "@/components/auth/auth-provider";
import { PendingIntentHandler } from "@/components/auth/pending-intent-handler";

const themeInitScript = `(function(){try{document.documentElement.classList.add('light');document.documentElement.classList.remove('dark');localStorage.setItem('yike-theme','light');}catch(e){}})();`;

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
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-48.png", sizes: "48x48", type: "image/png" },
      {
        url: "/icons/android-chrome-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icons/android-chrome-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
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
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link
          rel="apple-touch-startup-image"
          href="/splash/splash-1284x2778.png"
          media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/splash-1170x2532.png"
          media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link rel="apple-touch-startup-image" href="/splash/splash-1080x1920.png" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased transition-colors duration-300">
        <ThemeProvider>
          <AuthProvider>
            <StructuredData />
            {children}
            <Suspense fallback={null}>
              <AnalyticsProvider />
            </Suspense>
            <ScrollRetention />
            <GuestFavoriteSync />
            <PendingIntentHandler />
          </AuthProvider>
          <Analytics />
          <PwaRegister />
          <PwaInstallPrompt />
        </ThemeProvider>
      </body>
    </html>
  );
}
