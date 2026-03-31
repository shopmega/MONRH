"use client";

import Link from "next/link";
import { useLanguage } from "@/components/language-provider";

const AVIS_SITE_URL = process.env.NEXT_PUBLIC_AVIS_SITE_URL?.replace(/\/$/, "") || "https://avisine.com";
const BRAND_NAME = "AVISINE";

export type ReviewlyCompany = {
  id: string;
  name: string;
  overall_rating?: number | null;
};

export function ReviewlyPromoCard({
  type = "general",
  company,
}: {
  type?: "general" | "conflict" | "transition";
  company?: ReviewlyCompany | null;
}) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const content = {
    general: {
      title: isAr ? `شارك تجربتك على ${BRAND_NAME}` : `Partagez votre experience sur ${BRAND_NAME}`,
      description: isAr
        ? "ساعد باحثين وموظفين آخرين عبر مشاركة تجربة موثقة عن الشركة."
        : "Aidez d'autres salaries en partageant une experience utile et verifiee sur l'entreprise.",
      cta: isAr ? "Ajouter un avis" : "Ajouter un avis",
    },
    conflict: {
      title: isAr ? "تحقق من سياق المشغل" : "Verifier le contexte employeur",
      description: isAr
        ? `راجع إشارات الشركة والرواتب وآراء الموظفين على ${BRAND_NAME} قبل اتخاذ الخطوة التالية.`
        : `Consultez les signaux employeur, les salaires et les avis sur ${BRAND_NAME} avant d'agir.`,
      cta: isAr ? "Voir les signaux employeur" : "Voir les signaux employeur",
    },
    transition: {
      title: isAr ? "قبل قبول العرض" : "Avant d'accepter l'offre",
      description: isAr
        ? `تحقق من السمعة والرواتب وتجارب الموظفين على ${BRAND_NAME}.`
        : `Verifiez la reputation, les salaires et les retours employes sur ${BRAND_NAME}.`,
      cta: isAr ? "Rechercher l'entreprise" : "Rechercher l'entreprise",
    },
  };

  const activeContent = content[type];
  const href = company?.id ? `${AVIS_SITE_URL}/companies/${company.id}` : `${AVIS_SITE_URL}/`;
  const ctaLabel = company?.name
    ? (isAr ? `Voir les signaux pour ${company.name}` : `Voir les signaux pour ${company.name}`)
    : activeContent.cta;

  return (
    <article className="soft-card overflow-hidden rounded-3xl border border-[var(--line)] bg-gradient-to-br from-[var(--surface)] to-[var(--surface-muted)] p-1">
      <div className="rounded-[1.4rem] bg-[var(--surface)] p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)] text-lg font-bold text-white">
            A
          </div>
          <div>
            <h3 className="display-font font-semibold text-[var(--foreground)]">{BRAND_NAME}</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--ink-soft)]">
              Employer intelligence
            </p>
          </div>
        </div>

        <div className="mt-4">
          <h4 className="font-semibold text-[var(--foreground)]">{activeContent.title}</h4>
          <p className="mt-1 text-sm leading-relaxed text-[var(--ink-soft)]">
            {activeContent.description}
          </p>
        </div>

        <Link
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary mt-5 flex w-full items-center justify-center py-2.5 text-sm font-semibold transition-all hover:scale-[1.02]"
        >
          {ctaLabel}
          <svg
            className={`ms-2 h-4 w-4 ${isAr ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
      </div>
    </article>
  );
}
