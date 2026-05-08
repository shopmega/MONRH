import type { Metadata } from "next";
import Link from "next/link";
import { BreadcrumbJsonLd } from "@/components/breadcrumb-json-ld";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Contact",
  description: "Contactez SIMPAIE pour une question, une correction, un partenariat ou une demande concernant le site.",
  canonicalPath: "/contact",
});

const contactReasons = [
  "Signaler une erreur ou une information a mettre a jour",
  "Demander une correction concernant un article, outil ou modele",
  "Contacter l'equipe pour un partenariat ou une opportunite media",
  "Exercer une demande relative a vos donnees personnelles",
];

export default function ContactPage() {
  return (
    <main className="paper-bg min-h-screen">
      <BreadcrumbJsonLd items={[{ name: "Contact", href: "/contact" }]} />
      <section className="mx-auto grid w-full max-w-6xl gap-6 px-5 pb-16 pt-28 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
        <div className="soft-card rounded-[2rem] p-6 sm:p-8">
          <p className="section-kicker">Contact</p>
          <h1 className="display-font mt-3 text-4xl font-semibold text-[var(--heading)] sm:text-5xl">
            Contacter SIMPAIE
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--ink-soft)]">
            Pour une question sur le site, une correction, une demande liee aux donnees personnelles ou une proposition de partenariat, utilisez l'adresse de contact ci-dessous.
          </p>

          <div className="mt-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--ink-soft)]">Email</p>
            <a
              href="mailto:contact@simpaie.ma"
              className="mt-2 inline-flex text-lg font-semibold text-[var(--accent)] underline-offset-4 hover:underline"
            >
              contact@simpaie.ma
            </a>
          </div>
        </div>

        <aside className="panel-strong rounded-2xl p-5">
          <h2 className="display-font text-2xl font-semibold text-[var(--heading)]">Demandes traitees</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--ink-soft)]">
            {contactReasons.map((reason) => (
              <li key={reason} className="border-b border-[var(--line)] pb-3 last:border-0 last:pb-0">
                {reason}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-xs leading-6 text-[var(--ink-soft)]">
            Pour comprendre l'utilisation des donnees, consultez aussi la{" "}
            <Link href="/privacy" className="font-semibold text-[var(--accent)] underline-offset-4 hover:underline">
              politique de confidentialite
            </Link>
            .
          </p>
        </aside>
      </section>
    </main>
  );
}
