import type { Metadata } from "next";
import { HomePageClient } from "@/components/home-page-client";
import { DEFAULT_OG_IMAGE_PATH, SITE_DESCRIPTION, SITE_NAME, absoluteUrl } from "@/lib/seo";
import { readAdminConfig } from "@/lib/server/admin-config";
import { deriveCategoriesFromArticles } from "@/lib/server/categories";
import { canAccessArticle, listArticles } from "@/lib/server/articles-store";
import { isUserAuthenticated } from "@/lib/server/user-session";

export async function generateMetadata(): Promise<Metadata> {
  const config = await readAdminConfig();
  const siteName = config.websiteSettings.siteName.trim() || SITE_NAME;
  const siteDescription =
    config.websiteSettings.siteDescription.trim() ||
    SITE_DESCRIPTION;

  return {
    title: "Salaire, Litiges, CNSS et Modeles RH Maroc",
    description: siteDescription,
    alternates: {
      canonical: "/",
      languages: {
        "fr-MA": "/",
        "ar-MA": "/",
        "x-default": "/",
      },
    },
    openGraph: {
      title: `${siteName} - Droit du Travail Maroc`,
      description: siteDescription,
      url: "/",
      images: [
        {
          url: absoluteUrl(DEFAULT_OG_IMAGE_PATH),
          width: 1200,
          height: 630,
          alt: `${siteName} accueil`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${siteName} - Droit du Travail Maroc`,
      description: siteDescription,
      images: [absoluteUrl(DEFAULT_OG_IMAGE_PATH)],
    },
  };
}

export default async function HomePage() {
  const [articles, config, userAuthenticated] = await Promise.all([
    listArticles(),
    readAdminConfig(),
    isUserAuthenticated(),
  ]);
  const visibleArticles = articles.filter((item) => canAccessArticle(item, userAuthenticated));
  const defaultCover = config.websiteSettings.defaultArticleCoverUrl.trim();
  const hydrated = visibleArticles.map((item) => ({
    ...item,
    thumbnailUrl: item.thumbnailUrl || item.coverImageUrl || defaultCover || undefined,
    coverImageUrl: item.coverImageUrl || item.thumbnailUrl || defaultCover || undefined,
  }));
  const categories = deriveCategoriesFromArticles(hydrated);
  return <HomePageClient initialArticles={hydrated} categories={categories} />;
}
