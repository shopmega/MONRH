"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { AdSlot } from "@/components/ad-slot";
import { RelatedContent } from "@/components/related-content";
import { renderArticleContentBlocks } from "@/lib/articles/content-render";
import { resolveRelatedItems } from "@/lib/linking/resolve-related";
import type { Article } from "@/lib/content/home-content";

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
function SafeImage({ src, alt, className, ...props }: any) {
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
  articleJsonLd: any;
}

export function ArticleClient({ article, coverImage, articleJsonLd }: ArticleClientProps) {
  const [relatedItems, setRelatedItems] = useState<any[]>([]);

  useEffect(() => {
    resolveRelatedItems(article.categorySlug, article.slug).then(setRelatedItems);
  }, [article.categorySlug, article.slug]);

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
          <div className="prose prose-headings:display-font prose-p:text-[var(--foreground)] prose-li:text-[var(--foreground)] max-w-none">
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
