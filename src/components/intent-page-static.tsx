import Link from "next/link";
import type { IntentPageDefinition } from "@/lib/navigation/intent-pages";

export function IntentPageStatic({ page }: { page: IntentPageDefinition }) {
  return (
    <main className="paper-bg min-h-screen">
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-10 pt-6 sm:px-6">
        <section className="soft-card rounded-[2rem] p-6 sm:p-8">
          <p className="section-kicker">{page.kicker}</p>
          <h1 className="display-font mt-2 text-4xl font-semibold leading-tight sm:text-5xl">{page.title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--ink-soft)]">{page.description}</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link href={page.primaryCtaHref} className="btn-primary px-5 py-3 text-sm">
              {page.primaryCtaLabel}
            </Link>
            {page.secondaryCtaHref && page.secondaryCtaLabel ? (
              <Link href={page.secondaryCtaHref} className="btn-muted px-5 py-3 text-sm">
                {page.secondaryCtaLabel}
              </Link>
            ) : null}
          </div>
          <ul className="mt-5 grid gap-2 text-sm text-[var(--ink-soft)] sm:grid-cols-3">
            {page.bullets.map((bullet) => (
              <li key={bullet} className="rounded-2xl border border-[var(--line)] bg-[var(--surface-muted)] px-4 py-3">
                {bullet}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {page.related.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-3xl p-5 transition hover:-translate-y-0.5 ${
                  index % 2 === 0 ? "soft-card" : "panel-strong border border-[var(--line)]"
                }`}
              >
                <p className="section-kicker">{page.kicker}</p>
                <h2 className="display-font mt-2 text-2xl font-semibold leading-tight">{item.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">{item.description}</p>
                <span className="mt-5 inline-flex text-sm font-semibold text-[var(--accent)]">Ouvrir</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
