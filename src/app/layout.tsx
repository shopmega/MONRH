import type { Metadata } from "next";
import { AdsenseScript } from "@/components/adsense-script";
import { GoogleAnalytics } from "@/components/google-analytics";
import { LanguageProvider } from "@/components/language-provider";
import { MaintenanceBanner } from "@/components/maintenance-banner";
import { PublicConfigProvider } from "@/components/public-config-provider";
import { PwaRegistration } from "@/components/pwa-registration";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { CommandCenter } from "@/components/command-center";
import { ThemeProvider } from "@/components/theme-provider";
import {
  DEFAULT_OG_IMAGE_ALT,
  DEFAULT_OG_IMAGE_PATH,
  SITE_NAME,
  SITE_DESCRIPTION,
  SITE_URL,
  absoluteUrl,
} from "@/lib/seo";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
});

const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() ?? "";
const organizationId = absoluteUrl("/#organization");
const websiteId = absoluteUrl("/#website");
const rootJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": organizationId,
      name: SITE_NAME,
      url: SITE_URL,
    },
    {
      "@type": "WebSite",
      "@id": websiteId,
      name: SITE_NAME,
      url: SITE_URL,
      inLanguage: ["fr-MA", "ar-MA"],
      description: SITE_DESCRIPTION,
      publisher: {
        "@id": organizationId,
      },
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/articles?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

const preferenceBootstrapScript = `
(() => {
  try {
    const language = localStorage.getItem("salarie_language") === "ar" ? "ar" : "fr";
    const theme = localStorage.getItem("salarie_theme") === "dark" ? "dark" : "light";
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.dataset.theme = theme;
  } catch {}
})();
`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "droit du travail maroc",
    "simulateur salaire maroc",
    "indemnite licenciement maroc",
    "modele lettre employe",
    "cnss maroc",
  ],
  alternates: {
    canonical: "/",
    languages: {
      "fr-MA": "/",
      "ar-MA": "/",
      "x-default": "/",
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    locale: "fr_MA",
    alternateLocale: ["ar_MA"],
    images: [
      {
        url: absoluteUrl(DEFAULT_OG_IMAGE_PATH),
        width: 1200,
        height: 630,
        alt: DEFAULT_OG_IMAGE_ALT,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [absoluteUrl(DEFAULT_OG_IMAGE_PATH)],
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "64x64" },
      { url: "/logo.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  other: {
    "theme-color": "#0f172a",
    ...(adsenseClient ? { "google-adsense-account": adsenseClient } : {}),
  },
  category: "legal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" dir="ltr" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: preferenceBootstrapScript }} />
        {adsenseClient ? <meta name="google-adsense-account" content={adsenseClient} /> : null}
      </head>
      <body className={`${inter.variable} ${manrope.variable} antialiased bg-[var(--background)] text-[var(--foreground)] selection:bg-[var(--juris-primary-container)] selection:text-white`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(rootJsonLd),
          }}
        />
        <LanguageProvider initialLanguage="fr">
          <ThemeProvider initialTheme="light">
            <PublicConfigProvider>
              <GoogleAnalytics />
              <PwaRegistration />
              <AdsenseScript />
              <MaintenanceBanner />
              <SiteNav />
              <CommandCenter />
              <div className="pb-24 md:pb-8">{children}</div>
              <SiteFooter />
            </PublicConfigProvider>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
