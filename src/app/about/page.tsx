import type { Metadata } from "next";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "A Propos",
  description: "A propos de TON RH, plateforme d'information pratique sur le travail, la paie, la CNSS et les demarches RH au Maroc.",
  canonicalPath: "/about",
});

export default function AboutPage() {
  return (
    <main className="paper-bg min-h-screen">
      <section className="mx-auto w-full max-w-5xl px-5 pb-16 pt-28 sm:px-6 lg:px-8">
        <div className="soft-card rounded-[2rem] p-6 sm:p-8">
          <p className="section-kicker">A propos</p>
          <h1 className="display-font mt-3 text-4xl font-semibold text-[var(--heading)] sm:text-5xl">
            TON RH aide les salaries et professionnels RH au Maroc a comprendre leurs demarches.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--ink-soft)]">
            La plateforme rassemble des simulateurs, guides, modeles et outils pratiques autour du salaire, des contrats, de la CNSS, des conges, des litiges et des situations de depart.
          </p>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {[
            {
              title: "Comprendre",
              body: "Des contenus clairs pour expliquer les principaux sujets du droit du travail et de la paie au Maroc.",
            },
            {
              title: "Calculer",
              body: "Des simulateurs pour estimer un salaire, un preavis, une indemnite, des conges ou un risque RH.",
            },
            {
              title: "Agir",
              body: "Des modeles et prochaines etapes pour preparer une demande, une reclamation ou un document utile.",
            },
          ].map((item) => (
            <article key={item.title} className="panel-strong rounded-2xl p-5">
              <h2 className="display-font text-2xl font-semibold text-[var(--heading)]">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">{item.body}</p>
            </article>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 text-sm leading-7 text-[var(--ink-soft)]">
          <p>
            TON RH fournit des informations indicatives et ne remplace pas l'avis d'un avocat, expert-comptable, inspecteur du travail ou autre professionnel competent. Pour une question sur le site, consultez la{" "}
            <Link href="/contact" className="font-semibold text-[var(--accent)] underline-offset-4 hover:underline">
              page contact
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
