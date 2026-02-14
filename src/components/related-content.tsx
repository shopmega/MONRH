"use client";

import Link from "next/link";
import { useLanguage } from "@/components/language-provider";

type RelatedItem = {
  title: string;
  description: string;
  href: string;
};

export function RelatedContent({ items }: { items: RelatedItem[] }) {
  const { t } = useLanguage();

  return (
    <section className="soft-card mt-5 min-w-0 rounded-3xl p-5">
      <h2 className="display-font break-words text-2xl font-semibold">{t("common.relatedContent")}</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <article
            key={item.href}
            className={`min-w-0 rounded-2xl p-4 ${index % 2 === 0 ? "soft-card" : "panel-strong border border-[var(--line)]"}`}
          >
            <h3 className="break-words font-semibold">{item.title}</h3>
            <p className="mt-1 break-words text-sm text-[var(--ink-soft)]">{item.description}</p>
            <Link href={item.href} className="mt-3 inline-block text-sm font-semibold text-[var(--accent)]">
              {t("common.open")}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
