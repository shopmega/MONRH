import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AdsenseScript } from "@/components/adsense-script";
import { AnalyticsTracker } from "@/components/analytics-tracker";
import { GoogleAnalyticsScript } from "@/components/google-analytics-script";
import { LanguageProvider } from "@/components/language-provider";
import { MaintenanceBanner } from "@/components/maintenance-banner";
import { PublicConfigProvider } from "@/components/public-config-provider";
import { SiteNav } from "@/components/site-nav";
import { ThemeProvider } from "@/components/theme-provider";
import {
  DEFAULT_OG_IMAGE_ALT,
  DEFAULT_OG_IMAGE_PATH,
  SITE_URL,
  absoluteUrl,
} from "@/lib/seo";
import { readAdminConfig } from "@/lib/server/admin-config";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const config = await readAdminConfig();
  const siteName = config.websiteSettings.siteName.trim() || "Salarie.ma";
  const siteDescription =
    config.websiteSettings.siteDescription.trim() ||
    "Simulateurs de droits des salaries au Maroc, generateurs de documents et articles juridiques clairs.";

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
    description: siteDescription,
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
      siteName,
      title: siteName,
      description: siteDescription,
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
      title: siteName,
      description: siteDescription,
      images: [absoluteUrl(DEFAULT_OG_IMAGE_PATH)],
    },
    category: "legal",
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const config = await readAdminConfig();
  const languageCookie = cookieStore.get("salarie_language")?.value;
  const themeCookie = cookieStore.get("salarie_theme")?.value;
  const initialLanguage = languageCookie === "ar" ? "ar" : "fr";
  const initialTheme = themeCookie === "dark" ? "dark" : "light";
  const siteName = config.websiteSettings.siteName.trim() || "Salarie.ma";
  const siteDescription =
    config.websiteSettings.siteDescription.trim() ||
    "Simulateurs de droits des salaries au Maroc, generateurs de documents et articles juridiques clairs.";
  const sameAs = [
    config.websiteSettings.socialLinks.facebook.trim(),
    config.websiteSettings.socialLinks.instagram.trim(),
    config.websiteSettings.socialLinks.linkedin.trim(),
    config.websiteSettings.socialLinks.x.trim(),
  ].filter((item) => item.length > 0);
  const supportEmail = config.websiteSettings.supportEmail.trim();
  const logoUrl = config.websiteSettings.logoUrl.trim();

  return (
    <html lang={initialLanguage} dir={initialLanguage === "ar" ? "rtl" : "ltr"} data-theme={initialTheme}>
      <body className="antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: siteName,
              url: SITE_URL,
              inLanguage: ["fr-MA", "ar-MA"],
              description: siteDescription,
              potentialAction: {
                "@type": "SearchAction",
                target: `${SITE_URL}/bibliotheque?q={search_term_string}`,
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: siteName,
              url: SITE_URL,
              ...(logoUrl ? { logo: logoUrl } : {}),
              ...(supportEmail ? { email: supportEmail } : {}),
              ...(sameAs.length > 0 ? { sameAs } : {}),
            }),
          }}
        />
        <LanguageProvider initialLanguage={initialLanguage}>
          <ThemeProvider initialTheme={initialTheme}>
            <PublicConfigProvider>
              <AnalyticsTracker />
              <GoogleAnalyticsScript />
              <AdsenseScript />
              <MaintenanceBanner />
              <SiteNav />
              <div className="pb-24 md:pb-8">{children}</div>
            </PublicConfigProvider>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
