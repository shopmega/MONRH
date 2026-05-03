"use client";

import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { BreadcrumbJsonLd } from "@/components/breadcrumb-json-ld";
import type { CategoryHub } from "@/lib/navigation/category-hubs";

export function CategoryHubPage({ hub }: { hub: CategoryHub }) {
  const { language } = useLanguage();
  const copy = language === "ar" ? "ar" : "fr";

  return (
    <main className="paper-bg min-h-screen">
      <BreadcrumbJsonLd items={[{ name: hub.title[copy], href: `/${hub.slug}` }]} />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-10 pt-24 sm:px-6">
        <section className="soft-card rounded-[2rem] p-6 sm:p-8">
          <p className="section-kicker">{hub.kicker[copy]}</p>
          <h1 className="display-font mt-2 text-4xl font-semibold leading-tight sm:text-5xl">
            {hub.title[copy]}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--ink-soft)]">
            {hub.description[copy]}
          </p>
          <div className="mt-5">
            <Link href={hub.featuredHref} className="btn-primary px-5 py-3 text-sm">
              {hub.featuredLabel[copy]}
            </Link>
            <p className="mt-3 max-w-2xl text-sm text-[var(--ink-soft)]">{hub.featuredDescription[copy]}</p>
          </div>
        </section>

        <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hub.links.map((link, index) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-3xl p-5 transition hover:-translate-y-0.5 ${
                index % 2 === 0 ? "soft-card" : "panel-strong border border-[var(--line)]"
              }`}
            >
              <p className="section-kicker">{hub.kicker[copy]}</p>
              <h2 className="display-font mt-2 text-2xl font-semibold leading-tight">{link.title[copy]}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">{link.description[copy]}</p>
              <span className="mt-5 inline-flex text-sm font-semibold text-[var(--accent)]">
                {copy === "ar" ? "افتح الأداة" : "Ouvrir l'outil"}
              </span>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
