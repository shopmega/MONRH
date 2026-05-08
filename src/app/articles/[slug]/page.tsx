import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITE_NAME, absoluteUrl, buildOgImageUrl } from "@/lib/seo";
import { buildBreadcrumbJsonLd } from "@/components/breadcrumb-json-ld";
import { readAdminConfig } from "@/lib/server/admin-config";
import { canAccessArticle, getArticleBySlugFromStore } from "@/lib/server/articles-store";
import { isUserAuthenticated } from "@/lib/server/user-session";
import { ArticleClient } from "./article-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [article, config, userAuthenticated] = await Promise.all([
    getArticleBySlugFromStore(slug),
    readAdminConfig(),
    isUserAuthenticated(),
  ]);
  if (!article || !canAccessArticle(article, userAuthenticated)) {
    return {};
  }

  const description = article.excerpt;
  const coverImage =
    article.coverImageUrl || article.thumbnailUrl || config.websiteSettings.defaultArticleCoverUrl.trim();
  const siteName = config.websiteSettings.siteName.trim() || SITE_NAME;
  const imageUrl = coverImage ? absoluteUrl(coverImage) : buildOgImageUrl(article.title, description, siteName);
  return {
    title: article.title,
    description,
    alternates: {
      canonical: article.href,
      languages: {
        "fr-MA": article.href,
        "ar-MA": article.href,
        "x-default": article.href,
      },
    },
    openGraph: {
      type: "article",
      url: absoluteUrl(article.href),
      title: article.title,
      description,
      siteName,
      locale: "fr_MA",
      alternateLocale: ["ar_MA"],
      authors: [siteName],
      publishedTime: article.lastUpdated,
      modifiedTime: article.lastUpdated,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [article, config, userAuthenticated] = await Promise.all([
    getArticleBySlugFromStore(slug),
    readAdminConfig(),
    isUserAuthenticated(),
  ]);

  if (!article || !canAccessArticle(article, userAuthenticated)) {
    notFound();
  }

  const coverImage =
    article.coverImageUrl || article.thumbnailUrl || config.websiteSettings.defaultArticleCoverUrl.trim();
  const siteName = config.websiteSettings.siteName.trim() || SITE_NAME;
  const logoUrl = config.websiteSettings.logoUrl.trim();
  const articleJsonLd = [
    buildBreadcrumbJsonLd([
      { name: "Articles", href: "/articles" },
      { name: article.title, href: article.href },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "@id": absoluteUrl(`${article.href}#article`),
      headline: article.title,
      description: article.excerpt,
      url: absoluteUrl(article.href),
      inLanguage: "fr-MA",
      isAccessibleForFree: (article.access ?? "public") === "public",
      datePublished: article.lastUpdated,
      dateModified: article.lastUpdated,
      author: {
        "@type": "Organization",
        "@id": absoluteUrl("/#organization"),
        name: siteName,
      },
      publisher: {
        "@type": "Organization",
        "@id": absoluteUrl("/#organization"),
        name: siteName,
        ...(logoUrl
          ? {
              logo: {
                "@type": "ImageObject",
                url: absoluteUrl(logoUrl),
              },
            }
          : {}),
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": absoluteUrl(article.href),
      },
      ...(coverImage ? { image: absoluteUrl(coverImage) } : {}),
    },
  ];

  return <ArticleClient article={article} coverImage={coverImage} articleJsonLd={articleJsonLd} />;
}
