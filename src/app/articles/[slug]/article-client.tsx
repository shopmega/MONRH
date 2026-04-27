"use client";

import Image from "next/image";
import type { ImageProps } from "next/image";
import { useState, useEffect } from "react";
import { AdSlot } from "@/components/ad-slot";
import { RelatedContent } from "@/components/related-content";
import { renderArticleContentBlocks } from "@/lib/articles/content-render";
import type { Article } from "@/lib/content/home-content";

type RelatedItem = {
  title: string;
  description: string;
  href: string;
};

// Image placeholder component
function ImagePlaceholder({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center bg-gradient-to-br from-[var(--surface-muted)] to-[var(--surface)] border border-[var(--line)] ${className}`}>
      <svg className="w-8 h-8 text-[var(--ink-soft)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>
  );
}

// Safe image component with fallback
type SafeImageProps = Omit<ImageProps, "src" | "alt"> & {
  src?: string;
  alt: string;
};

function SafeImage({ src, alt, className, ...props }: SafeImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return <ImagePlaceholder className={className} />;
  }

  return (
    <Image
      {...props}
      src={src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
    />
  );
}

function categoryName(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

interface ArticleClientProps {
  article: Article;
  coverImage: string;
  articleJsonLd: Record<string, unknown>;
}

export function ArticleClient({ article, coverImage, articleJsonLd }: ArticleClientProps) {
  const [relatedItems, setRelatedItems] = useState<RelatedItem[]>([]);

  useEffect(() => {
    const loadRelated = async () => {
      try {
        const url = `/api/public-linking?sourceType=article&sourceId=${encodeURIComponent(article.slug)}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        if (data.ok && Array.isArray(data.items)) {
          setRelatedItems(
            data.items.filter(
              (item: Partial<RelatedItem>) =>
                typeof item.title === "string" &&
                typeof item.description === "string" &&
                typeof item.href === "string",
            ),
          );
        } else {
          setRelatedItems([]);
        }
      } catch (error) {
        console.error("Failed to load related content:", error);
        setRelatedItems([]);
      }
    };

    loadRelated();
  }, [article.slug]);

  return (
    <main className="paper-bg min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <article className="mx-auto w-full max-w-3xl px-4 pb-10 pt-6 sm:px-6">
        <header className="soft-card rounded-[2rem] p-5 sm:p-7">
          <div className="mb-4 h-56 w-full">
            {coverImage ? (
              <div className="relative w-full h-full">
                <SafeImage
                  src={coverImage}
                  alt={article.title}
                  width={1400}
                  height={560}
                  className="h-56 w-full rounded-2xl object-cover border border-[var(--line)]"
                  unoptimized
                />
              </div>
            ) : (
              <ImagePlaceholder className="h-56 w-full rounded-2xl" />
            )}
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
            {categoryName(article.categorySlug)} | {article.readingTime}
          </p>
          <h1 className="display-font mt-2 text-3xl font-semibold leading-tight sm:text-4xl">
            {article.title}
          </h1>
          <p className="mt-4 text-lg text-[var(--ink-soft)]">{article.excerpt}</p>
        </header>

        <div className="mt-8 soft-card rounded-[2rem] p-5 sm:p-7">
          <div className="prose prose-headings:display-font prose-p:text-[var(--foreground)] prose-li:text-[var(--foreground)] max-w-none space-y-3">
            {renderArticleContentBlocks(article.content, `block-${article.slug}`)}
          </div>
        </div>

        <div className="mt-8">
          <AdSlot slot="1414141414" format="auto" />
        </div>

        {relatedItems.length > 0 && (
          <div className="mt-12">
            <RelatedContent items={relatedItems} />
          </div>
        )}
      </article>
    </main>
  );
}
