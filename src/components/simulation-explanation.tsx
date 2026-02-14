"use client";

import { useLanguage } from "@/components/language-provider";

type Explanation = {
  summary: string;
  assumptions: string[];
  formulas: string[];
  warnings: string[];
  nextSteps: string[];
};

export function SimulationExplanation({ explanation }: { explanation?: Explanation }) {
  const { t } = useLanguage();

  if (!explanation) {
    return null;
  }

  return (
    <section className="soft-card mt-4 min-w-0 rounded-3xl p-5">
      <h2 className="display-font break-words text-xl font-semibold">{t("explanation.title")}</h2>
      <p className="mt-2 rounded-2xl border border-[var(--line)] bg-[var(--surface-muted)] p-3 text-sm leading-relaxed text-[var(--foreground)] break-words">
        {explanation.summary}
      </p>

      <ExplanationList title={t("explanation.assumptions")} items={explanation.assumptions} />
      <ExplanationList title={t("explanation.formulas")} items={explanation.formulas} />
      <ExplanationList title={t("explanation.warnings")} items={explanation.warnings} />
      <ExplanationList title={t("explanation.nextSteps")} items={explanation.nextSteps} />
    </section>
  );
}

function ExplanationList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mt-3">
      <p className="break-words text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-soft)]">{title}</p>
      <ul className="mt-2 space-y-2 text-sm text-[var(--foreground)]">
        {items.map((item) => (
          <li key={item} className="rounded-xl border border-[var(--line)] bg-[var(--surface-elevated)] px-3 py-2 break-words">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
