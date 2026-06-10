import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/constants";
import { BRAND_OG_IMAGE, BRAND_OG_IMAGE_WEBP } from "@/lib/share-images";
import { brand, colors } from "@/lib/design/tokens";
import { StructuredData } from "@/components/seo/structured-data";
import { PwaRegister } from "@/components/pwa/register";
import { PullToRefresh } from "@/components/pwa/pull-to-refresh";
import { Analytics } from "@vercel/analytics/react";
import { Suspense } from "react";
import { AnalyticsProvider } from "@/components/analytics/analytics-provider";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ScrollRetention } from "@/components/retention/scroll-retention";
import { GuestFavoriteSync } from "@/components/retention/guest-favorite-sync";
import { UserActivitySync } from "@/components/retention/user-activity-sync";
import { AuthProvider } from "@/components/auth/auth-provider";
import { PendingIntentHandler } from "@/components/auth/pending-intent-handler";

const themeInitScript = `(function(){try{document.documentElement.classList.add('light');document.documentElement.classList.remove('dark');localStorage.setItem('yike-theme','light');}catch(e){}})();`;

/** Drop stale browser service workers inside Android TWA before they intercept navigation. */
const twaSwCleanupScript = `(function(){try{if(document.referrer.indexOf('android-app://')!==0)return;if(!('serviceWorker' in navigator))return;navigator.serviceWorker.getRegistrations().then(function(regs){regs.forEach(function(r){r.unregister();});});}catch(e){}})();`;

/** Arm splash + app-mode class for installed PWA/TWA. Normal web stays visible immediately. */
const bootSplashArmScript = `(function(){try{var nav=window.navigator||{};var app=document.referrer.indexOf('android-app://')===0;if(!app&&window.matchMedia){app=window.matchMedia('(display-mode: standalone)').matches||window.matchMedia('(display-mode: fullscreen)').matches||window.matchMedia('(display-mode: minimal-ui)').matches;}if(!app&&nav.standalone===true)app=true;document.documentElement.classList.add(app?'yike-app-mode':'yike-web-mode');document.documentElement.classList.add(app?'yike-boot-splash-enabled':'yike-boot-splash-disabled');}catch(e){document.documentElement.classList.add('yike-web-mode','yike-boot-splash-disabled');}})();`;

/** Cosmetic splash dismissal: fail open by 2.5s, never waits on auth/SW/API. */
const bootSplashHideScript = `(function(){var done=false;var MAX=2500;function htmlDone(){document.documentElement.classList.remove('yike-boot-splash-enabled');document.documentElement.classList.add('yike-boot-splash-disabled');}function hide(){if(done)return;var s=document.getElementById('yike-boot-splash');if(!s){htmlDone();done=true;return;}done=true;htmlDone();s.classList.add('yike-boot-splash--out');setTimeout(function(){if(s&&s.parentNode)s.parentNode.removeChild(s);},280);}function showRecovery(){if(done)return;var s=document.getElementById('yike-boot-splash');if(s)s.classList.add('yike-boot-splash--recovery');}function bind(){var c=document.getElementById('yike-boot-continue');var r=document.getElementById('yike-boot-refresh');if(c)c.addEventListener('click',hide,{once:true});if(r)r.addEventListener('click',function(){window.location.reload();},{once:true});}function boot(){bind();if(!document.documentElement.classList.contains('yike-boot-splash-enabled')){hide();return;}setTimeout(showRecovery,1800);setTimeout(hide,1500);setTimeout(hide,MAX);}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();window.addEventListener('pageshow',function(){setTimeout(hide,MAX);},{once:true});})();`;

const supabaseOrigin = (() => {
  try {
    const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    return raw ? new URL(raw).origin : null;
  } catch {
    return null;
  }
})();

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const ogImage = BRAND_OG_IMAGE;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Find Real Houses in Nigeria`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_TAGLINE,
  keywords: [
    "Yike",
    "Nigerian property marketplace",
    "houses for rent Nigeria",
    "apartments Nigeria",
    "shortlets Lagos",
    "self contain Owerri",
    "house in Aba",
    "apartment in Enugu",
    "verified listings",
    "verified agents",
    "buy house Nigeria",
    "rent apartment Nigeria",
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
      { url: "/images/logo.webp", sizes: "512x512", type: "image/webp" },
      { url: "/images/logo-sm.webp", sizes: "192x192", type: "image/webp" },
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
    images: [
      { url: ogImage, width: 1200, height: 630, alt: "Yike — Nigerian housing marketplace", type: "image/png" },
      { url: BRAND_OG_IMAGE_WEBP, width: 1200, height: 630, alt: "Yike — Nigerian housing marketplace", type: "image/webp" },
    ],
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
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    yandex: process.env.YANDEX_SITE_VERIFICATION,
    other: {
      "msvalidate.01":
        process.env.BING_SITE_VERIFICATION ??
        "02902039559EB4CCB652E858CBFF27B8",
    },
  },
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
        <meta
          name="msvalidate.01"
          content={
            process.env.BING_SITE_VERIFICATION ??
            "02902039559EB4CCB652E858CBFF27B8"
          }
        />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        {supabaseOrigin ? (
          <>
            <link rel="dns-prefetch" href={supabaseOrigin} />
            <link rel="preconnect" href={supabaseOrigin} crossOrigin="" />
          </>
        ) : null}
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://images.unsplash.com" />
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
        <script dangerouslySetInnerHTML={{ __html: bootSplashArmScript }} />
        <script dangerouslySetInnerHTML={{ __html: twaSwCleanupScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased transition-colors duration-300">
        <div id="yike-boot-splash" aria-hidden="true">
          <div className="yike-boot-splash__content">
            <div className="yike-boot-splash__mark">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/logo-mark.webp"
                alt=""
                width={120}
                height={120}
                decoding="sync"
              />
            </div>
            <div className="yike-boot-splash__recovery">
              <p>We&apos;re having trouble loading. Tap to continue.</p>
              <div className="yike-boot-splash__actions">
                <button
                  id="yike-boot-continue"
                  className="yike-boot-splash__continue"
                  type="button"
                >
                  Continue
                </button>
                <button
                  id="yike-boot-refresh"
                  className="yike-boot-splash__refresh"
                  type="button"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>
        <script dangerouslySetInnerHTML={{ __html: bootSplashHideScript }} />
        <ThemeProvider>
          <AuthProvider>
            <StructuredData />
            {children}
            <Suspense fallback={null}>
              <AnalyticsProvider />
            </Suspense>
            <ScrollRetention />
            <GuestFavoriteSync />
            <UserActivitySync />
            <PendingIntentHandler />
          </AuthProvider>
          <Analytics />
          <PwaRegister />
          <PullToRefresh />
        </ThemeProvider>
      </body>
    </html>
  );
}
