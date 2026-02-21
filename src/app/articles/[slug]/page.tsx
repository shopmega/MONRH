import type { Metadata } from "next";
import Image from "next/image";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/ad-slot";
import { RelatedContent } from "@/components/related-content";
import { resolveRelatedItems } from "@/lib/linking/resolve-related";
import { SITE_NAME, absoluteUrl, buildOgImageUrl } from "@/lib/seo";
import { readAdminConfig } from "@/lib/server/admin-config";
import { canAccessArticle, getArticleBySlugFromStore } from "@/lib/server/articles-store";
import { isUserAuthenticated } from "@/lib/server/user-session";

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
      title: article.title,
      description,
      url: article.href,
      siteName,
      images: [
        {
          url: coverImage || imageUrl,
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
      images: [coverImage || imageUrl],
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
  const mappedItems = await resolveRelatedItems({
    sourceType: "article",
    sourceId: slug,
    userAuthenticated,
  });
  const coverImage =
    article?.coverImageUrl || article?.thumbnailUrl || config.websiteSettings.defaultArticleCoverUrl.trim();
  const siteName = config.websiteSettings.siteName.trim() || SITE_NAME;
  const articleUrl = absoluteUrl(article.href);
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    datePublished: article.lastUpdated,
    dateModified: article.lastUpdated,
    inLanguage: ["fr-MA", "ar-MA"],
    mainEntityOfPage: articleUrl,
    image: coverImage ? [coverImage] : undefined,
    author: {
      "@type": "Organization",
      name: siteName,
    },
    publisher: {
      "@type": "Organization",
      name: siteName,
    },
  };
  const language = (await cookies()).get("salarie_language")?.value === "ar" ? "ar" : "fr";
  const labels =
    language === "ar"
      ? {
          updatedAt: "آخر تحديث",
          partner: "شريك",
          relatedArticles: "مقالات ذات صلة",
          relatedArticlesDesc: "تابع القراءة مع محتويات قانونية أخرى.",
          relatedSimulators: "محاكيات مرتبطة",
          relatedSimulatorsDesc: "اختبر الحسابات حسب وضعيتك الفعلية.",
          relatedDocs: "وثائق جاهزة",
          relatedDocsDesc: "أنشئ رسالة مهنية في خطوات قليلة.",
        }
      : {
          updatedAt: "Derniere mise a jour",
          partner: "Partenaire",
          relatedArticles: "Articles lies",
          relatedArticlesDesc: "Continuez votre lecture avec d'autres contenus juridiques.",
          relatedSimulators: "Simulateurs associes",
          relatedSimulatorsDesc: "Testez les calculs selon votre situation concrete.",
          relatedDocs: "Documents pre-remplis",
          relatedDocsDesc: "Generez une lettre professionnelle en quelques etapes.",
        };

  return (
    <main className="paper-bg min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <article className="mx-auto w-full max-w-3xl px-4 pb-10 pt-6 sm:px-6">
        <header className="soft-card rounded-[2rem] p-5 sm:p-7">
          {coverImage ? (
            <Image
              src={coverImage}
              alt={article.title}
              width={1400}
              height={560}
              className="mb-4 h-56 w-full rounded-2xl object-cover"
              unoptimized
            />
          ) : null}
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
            {categoryName(article.categorySlug)} | {article.readingTime}
          </p>
          <h1 className="display-font mt-2 text-3xl font-semibold leading-tight sm:text-4xl">
            {article.title}
          </h1>
          <p className="mt-3 text-sm text-[var(--ink-soft)]">
            {labels.updatedAt}: {article.lastUpdated}
          </p>
        </header>

        <section className="mt-5">
          <p className="section-kicker pl-1">{labels.partner}</p>
          <div className="soft-card mt-2 rounded-3xl p-3">
            <AdSlot slot="1313131313" format="auto" />
          </div>
        </section>

        <section className="soft-card mt-5 rounded-3xl p-5 sm:p-6">
          <div className="space-y-4 text-[15px] leading-8 text-[var(--foreground)] sm:text-base">
            {article.content.map((paragraph, index) => (
              <p key={`${article.slug}-p-${index}`}>{paragraph}</p>
            ))}
          </div>
        </section>

        <section className="mt-5">
          <p className="section-kicker pl-1">{labels.partner}</p>
          <div className="soft-card mt-2 rounded-3xl p-3">
            <AdSlot slot="1414141414" format="auto" />
          </div>
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
