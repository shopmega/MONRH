import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITE_NAME, absoluteUrl, buildOgImageUrl } from "@/lib/seo";
import { readAdminConfig } from "@/lib/server/admin-config";
import { canAccessArticle, getArticleBySlugFromStore } from "@/lib/server/articles-store";
import { isUserAuthenticated } from "@/lib/server/user-session";
import { ArticleClient } from "./article-client";

function categoryName(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

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
  const imageUrl = buildOgImageUrl(article.title, description, siteName);
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
      publishedTime: article.publishedAt,
      modifiedTime: article.lastUpdatedAt,
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
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    url: absoluteUrl(article.href),
    datePublished: article.publishedAt,
    dateModified: article.lastUpdatedAt,
    author: {
      "@type": "Organization",
      name: siteName,
    },
    publisher: {
      "@type": "Organization",
      name: siteName,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl(config.websiteSettings.logoUrl.trim() || ""),
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": absoluteUrl(article.href),
    },
    ...(coverImage ? { image: absoluteUrl(coverImage) } : {}),
  };

  return (
    <main>
      <article>
        <section>
          <ArticleClient article={article} coverImage={coverImage} articleJsonLd={articleJsonLd} />
          <AdSlot slot="1414141414" format="auto" />
        </section>

        <RelatedContent
          items={
            mappedItems.length > 0
              ? mappedItems
              : [
                  {
                    title: labels.relatedArticles,
                    description: labels.relatedArticlesDesc,
                    href: "/bibliotheque",
                  },
                  {
                    title: labels.relatedSimulators,
                    description: labels.relatedSimulatorsDesc,
                    href: "/simulateurs",
                  },
                  {
                    title: labels.relatedDocs,
                    description: labels.relatedDocsDesc,
                    href: "/documents",
                  },
                ]
          }
        />
      </article>
    </main>
  );
}
