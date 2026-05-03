import Link from "next/link";
import { BreadcrumbJsonLd } from "@/components/breadcrumb-json-ld";

type LegalSection = {
  title: string;
  body: string[];
};

type LegalPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  updatedAt: string;
  sections: LegalSection[];
  path?: string;
  contactHref?: string;
};

export function LegalPage({
  eyebrow,
  title,
  description,
  updatedAt,
  sections,
  path,
  contactHref = "/contact",
}: LegalPageProps) {
  return (
    <main className="paper-bg min-h-screen">
      <BreadcrumbJsonLd items={[{ name: title, href: path ?? contactHref }]} />
      <section className="mx-auto w-full max-w-4xl px-5 pb-16 pt-28 sm:px-6 lg:px-8">
        <div className="soft-card rounded-[2rem] p-6 sm:p-8">
          <p className="section-kicker">{eyebrow}</p>
          <h1 className="display-font mt-3 text-4xl font-semibold text-[var(--heading)] sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--ink-soft)]">
            {description}
          </p>
          <p className="mt-4 text-sm font-semibold text-[var(--ink-soft)]">
            Derniere mise a jour: {updatedAt}
          </p>
        </div>

        <div className="mt-6 space-y-5">
          {sections.map((section) => (
            <article key={section.title} className="panel-strong rounded-2xl p-5 sm:p-6">
              <h2 className="display-font text-2xl font-semibold text-[var(--heading)]">
                {section.title}
              </h2>
              <div className="mt-3 space-y-3 text-sm leading-7 text-[var(--ink-soft)]">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 text-sm text-[var(--ink-soft)]">
          <p>
            Pour toute question concernant ces informations, contactez SIMPAIE via{" "}
            <Link href={contactHref} className="font-semibold text-[var(--accent)] underline-offset-4 hover:underline">
              la page contact
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
