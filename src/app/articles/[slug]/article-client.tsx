"use client";

import Image from "next/image";
import type { ImageProps } from "next/image";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
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

function slugifyHeading(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function headingIdForBlock(heading: string, blockIndex: number) {
  return `section-${blockIndex}-${slugifyHeading(heading) || "article"}`;
}

function extractHeadings(blocks: string[]) {
  return blocks.flatMap((rawBlock, blockIndex) => {
    return rawBlock
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .flatMap((line) => {
        const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
        if (!headingMatch) return [];

        const title = headingMatch[2]
          .split(/\s+-\s+/)[0]
          .trim();
        return [{
          id: headingIdForBlock(title, blockIndex),
          title,
          level: headingMatch[1].length,
        }];
      });
  });
}

function isStructuralContentBlock(block: string) {
  const lines = block
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return true;
  return lines.every((line) =>
    /^(#{1,3})\s+/.test(line) ||
    /^[-*]\s+/.test(line) ||
    /^\d+\.\s+/.test(line) ||
    /^>\s?/.test(line) ||
    /^\|.+\|$/.test(line),
  );
}

function plainTextFromArticleBlock(block: string) {
  return block
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) =>
      line &&
      !/^(#{1,3})\s+/.test(line) &&
      !/^[-*]\s+/.test(line) &&
      !/^\d+\.\s+/.test(line) &&
      !/^>\s?/.test(line) &&
      !/^\|.+\|$/.test(line),
    )
    .join(" ")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function extractKeyPoints(article: Article) {
  const points = article.content
    .map((block) => {
      if (isStructuralContentBlock(block)) return "";
      const normalized = plainTextFromArticleBlock(block);
      return normalized.length > 155 ? `${normalized.slice(0, 152).trim()}...` : normalized;
    })
    .filter((point) => point.length > 80)
    .slice(0, 3);

  if (points.length > 0) return points;

  return [
    article.excerpt,
    "Verifiez les delais, les justificatifs et les interlocuteurs avant d'agir.",
    "Gardez une trace ecrite de chaque etape pour proteger votre dossier.",
  ];
}

function getActionLinks(categorySlug: string) {
  const lower = categorySlug.toLowerCase();

  if (lower.includes("cnss") || lower.includes("conges") || lower.includes("maternite")) {
    return [
      { href: "/conges-cnss", label: "Explorer Conges & CNSS", description: "Retrouvez les calculateurs et demarches associes." },
      { href: "/documents/cnss-complaint-letter", label: "Modele reclamation CNSS", description: "Preparez un courrier structure pour votre dossier." },
      { href: "/simulate/cnss-pension", label: "Simuler vos droits CNSS", description: "Estimez vos droits avec les donnees disponibles." },
    ];
  }

  if (lower.includes("licenciement") || lower.includes("contrat")) {
    return [
      { href: "/contrat-depart", label: "Parcours depart", description: "Comparez les droits lies a la rupture du contrat." },
      { href: "/simulate/licenciement", label: "Simuler l'indemnite", description: "Estimez les montants avant de negocier." },
      { href: "/modeles", label: "Voir les modeles", description: "Accedez aux lettres et documents utiles." },
    ];
  }

  if (lower.includes("salaire") || lower.includes("heures")) {
    return [
      { href: "/salaire", label: "Parcours salaire", description: "Calculez net, brut, IR et cotisations." },
      { href: "/simulate/overtime", label: "Heures supplementaires", description: "Estimez les majorations applicables." },
      { href: "/tools/payslip-detector", label: "Verifier une fiche de paie", description: "Controlez les anomalies visibles." },
    ];
  }

  if (lower.includes("litige") || lower.includes("harcelement")) {
    return [
      { href: "/litiges", label: "Parcours litiges", description: "Structurez les preuves et prochaines actions." },
      { href: "/tools/pre-litigation-timeline", label: "Feuille route", description: "Preparez les etapes avant contentieux." },
      { href: "/documents/formal-complaint-employer", label: "Reclamation employeur", description: "Generez un courrier de reclamation." },
    ];
  }

  return [
    { href: "/simulate", label: "Tous les simulateurs", description: "Estimez vos droits en quelques minutes." },
    { href: "/tools", label: "Outils de protection", description: "Controlez les risques et incoherences." },
    { href: "/modeles", label: "Modeles utiles", description: "Preparez les documents associes." },
  ];
}

interface ArticleClientProps {
  article: Article;
  coverImage: string;
  articleJsonLd: Record<string, unknown> | Record<string, unknown>[];
}

export function ArticleClient({ article, coverImage, articleJsonLd }: ArticleClientProps) {
  const [relatedItems, setRelatedItems] = useState<RelatedItem[]>([]);
  const headings = useMemo(() => extractHeadings(article.content), [article.content]);
  const keyPoints = useMemo(() => extractKeyPoints(article), [article]);
  const actionLinks = useMemo(() => getActionLinks(article.categorySlug), [article.categorySlug]);
  const categoryLabel = categoryName(article.categorySlug);
  const updatedDate = article.lastUpdated
    ? new Date(article.lastUpdated).toLocaleDateString("fr-MA", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "Date non precisee";
  const pageSections = [
    { id: "points-essentiels", title: "Points essentiels", level: 2 },
    { id: "guide-pratique", title: "Guide pratique", level: 2 },
    { id: "prochaines-etapes", title: "Prochaines etapes", level: 2 },
    { id: "outils-associes", title: "Outils associes", level: 2 },
  ];
  const tableOfContents = headings.length > 0
    ? [
        pageSections[0],
        pageSections[1],
        ...headings.map((heading) => ({ ...heading, level: Math.max(heading.level + 1, 3) })),
        pageSections[2],
        pageSections[3],
      ]
    : pageSections;

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
    <main className="paper-bg min-h-screen max-w-full overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <article className="mx-auto w-full max-w-7xl px-4 pb-12 pt-24 sm:px-6 lg:px-8">
        <header className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-stretch">
          <section className="soft-card min-w-0 rounded-[2rem] p-5 sm:p-7 lg:p-8">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
              <Link href="/articles" className="hover:text-[var(--accent-dark)]">Articles</Link>
              <span>/</span>
              <span>{categoryLabel}</span>
            </div>
            <h1 className="display-font mt-4 max-w-4xl break-words text-4xl font-semibold leading-tight sm:text-5xl">
              {article.title}
            </h1>
            <p className="mt-5 max-w-3xl break-words text-base leading-8 text-[var(--ink-soft)] sm:text-lg">
              {article.excerpt}
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                { label: "Categorie", value: categoryLabel },
                { label: "Lecture", value: article.readingTime },
                { label: "Mise a jour", value: updatedDate },
              ].map((item) => (
                <div key={item.label} className="panel-tonal rounded-2xl px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">{item.value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="min-w-0 overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[var(--surface)]">
            {coverImage ? (
              <div className="relative h-full min-h-72 w-full">
                <SafeImage
                  src={coverImage}
                  alt={article.title}
                  width={1400}
                  height={760}
                  className="h-full min-h-72 w-full object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <ImagePlaceholder className="h-full min-h-72 w-full" />
            )}
          </section>
        </header>

        <section id="points-essentiels" className="mt-6 scroll-mt-28 grid gap-3 md:grid-cols-3">
          {keyPoints.map((point, index) => (
            <div key={`${article.slug}-point-${index}`} className="panel-strong rounded-2xl p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                Point {index + 1}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">{point}</p>
            </div>
          ))}
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div className="min-w-0">
            <nav className="soft-card mb-5 rounded-3xl p-5 lg:hidden" aria-label="Sommaire de l'article">
              <h2 className="display-font text-xl font-semibold">Dans cet article</h2>
              <div className="mt-3 grid gap-2">
                {tableOfContents.map((heading) => (
                  <a
                    key={heading.id}
                    href={`#${heading.id}`}
                    className="rounded-xl bg-[var(--surface-muted)] px-3 py-2 text-sm font-semibold text-[var(--foreground)]"
                  >
                    {heading.title}
                  </a>
                ))}
              </div>
            </nav>

            <section id="guide-pratique" className="soft-card scroll-mt-28 rounded-[2rem] p-5 sm:p-7">
              <div className="mb-6 border-b border-[var(--line)] pb-4">
                <p className="section-kicker">Guide pratique</p>
                <h2 className="display-font mt-2 text-2xl font-semibold">Comprendre et agir</h2>
              </div>
              <div className="prose prose-headings:display-font prose-p:text-[var(--foreground)] prose-li:text-[var(--foreground)] max-w-none space-y-4 text-[var(--foreground)]">
                {renderArticleContentBlocks(article.content, `block-${article.slug}`, {
                  headingId: headingIdForBlock,
                })}
              </div>
            </section>

            <section id="prochaines-etapes" className="soft-card mt-6 scroll-mt-28 rounded-[2rem] p-5 sm:p-7">
              <p className="section-kicker">Prochaines etapes</p>
              <h2 className="display-font mt-2 text-2xl font-semibold">Passer de l'information a l'action</h2>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {actionLinks.map((item) => (
                  <Link key={item.href} href={item.href} className="panel-tonal rounded-2xl p-4 transition hover:-translate-y-0.5">
                    <p className="text-sm font-semibold text-[var(--foreground)]">{item.label}</p>
                    <p className="mt-2 text-xs leading-5 text-[var(--ink-soft)]">{item.description}</p>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          <aside className="min-w-0 space-y-5 lg:sticky lg:top-24">
            <nav className="soft-card hidden rounded-3xl p-5 lg:block" aria-label="Sommaire de l'article">
              <h2 className="display-font text-xl font-semibold">Dans cet article</h2>
              <div className="mt-3 space-y-1">
                {tableOfContents.map((heading) => (
                  <a
                    key={heading.id}
                    href={`#${heading.id}`}
                    className={`block rounded-xl px-3 py-2 text-sm font-semibold transition hover:bg-[var(--surface-muted)] ${
                      heading.level >= 3 ? "ml-3 text-[var(--ink-soft)]" : "text-[var(--foreground)]"
                    }`}
                  >
                    {heading.title}
                  </a>
                ))}
              </div>
            </nav>

            <section id="outils-associes" className="soft-card scroll-mt-28 rounded-3xl p-5">
              <h2 className="display-font text-xl font-semibold">Outils associes</h2>
              <div className="mt-3 space-y-2">
                {actionLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded-2xl border border-[var(--line)] bg-[var(--surface-muted)] p-3 transition hover:border-[var(--accent)]"
                  >
                    <p className="text-sm font-semibold text-[var(--foreground)]">{item.label}</p>
                    <p className="mt-1 text-xs leading-5 text-[var(--ink-soft)]">{item.description}</p>
                  </Link>
                ))}
              </div>
            </section>

            <section className="overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-3">
              <AdSlot slot="1414141414" format="auto" />
            </section>
          </aside>
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
