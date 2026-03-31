import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";
import { seoGuides } from "@/data/seo-guides";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const guide = seoGuides.find((g) => g.slug === resolvedParams.slug);
  if (!guide) {
    return {};
  }

  return buildPageMetadata({
    title: guide.title,
    description: guide.description,
    canonicalPath: `/sujets/${guide.slug}`,
  });
}

export async function generateStaticParams() {
  return seoGuides.map((guide) => ({
    slug: guide.slug,
  }));
}

export default async function SeoGuidePage({ params }: Props) {
  const resolvedParams = await params;
  const guide = seoGuides.find((g) => g.slug === resolvedParams.slug);
  if (!guide) {
    notFound();
  }

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: guide.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <main className="paper-bg min-h-screen pb-16 pt-8">
      <JsonLd data={faqSchema} />
      
      <article className="mx-auto max-w-3xl px-4 sm:px-6">
        <header className="mb-10 text-center">
          <p className="section-kicker mb-3">Guide Juridique et Simulateur</p>
          <h1 className="display-font text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl md:text-5xl">
            {guide.title}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[var(--ink-soft)]">
            {guide.description}
          </p>
        </header>

        {/* CTA Card injected early for high conversion */}
        <section className="mb-12 rounded-3xl border-2 border-[var(--accent)] bg-[var(--accent-soft)] p-6 sm:p-8 text-center shadow-sm">
          <h2 className="text-xl font-bold text-[var(--accent)]">
            Passez à l'action immédiate
          </h2>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Utilisez notre outil gratuit pour calculer votre situation exacte selon la loi marocaine en vigueur.
          </p>
          <Link
            href={guide.simulatorPath}
            className="btn-primary mt-6 inline-flex w-full items-center justify-center gap-2 px-6 py-3.5 text-base sm:w-auto"
          >
            Lancer le simulateur
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </section>

        {/* Markdown/HTML Content Block */}
        <div 
          className="prose prose-slate max-w-none prose-headings:font-display prose-headings:text-[var(--foreground)] prose-p:text-[var(--ink-soft)] prose-a:text-[var(--accent)] hover:prose-a:text-[var(--accent-dark)]"
          dangerouslySetInnerHTML={{ __html: guide.content.replace(/\n##\s/g, '<h2>').replace(/\n###\s/g, '<h3>').replace(/\n- /g, '<br/>• ') }}
          // Note: In a real app we'd use a markdown parser like 'marked' or 'react-markdown'.
          // For MVP, we do very basic string replacement or render Markdown safely.
        />

        {/* FAQ Section */}
        {guide.faqs.length > 0 && (
          <section className="mt-16">
            <h2 className="display-font text-2xl font-bold text-[var(--foreground)]">
              Questions Fréquentes
            </h2>
            <div className="mt-6 space-y-4">
              {guide.faqs.map((faq, index) => (
                <div key={index} className="rounded-2xl border border-[var(--line)] bg-[var(--surface-elevated)] p-5">
                  <h3 className="font-semibold text-[var(--foreground)]">
                    {faq.question}
                  </h3>
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </article>
    </main>
  );
}
