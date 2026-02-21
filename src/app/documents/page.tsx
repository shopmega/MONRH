"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdSlot } from "@/components/ad-slot";
import { useLanguage } from "@/components/language-provider";
import { ReviewlyPromoCard } from "@/components/reviewly-promo-card";
import type { DocumentTemplate } from "@/lib/content/home-content";

type GeneratorGroup = {
  titleKey: string;
  subtitleKey: string;
  templateIds: string[];
};

const templateArabicLabels: Record<string, { title: string; description: string }> = {
  "resignation-letter": {
    title: "رسالة استقالة",
    description: "نموذج واضح يتضمن تاريخ المغادرة ومدة الإشعار.",
  },
  "notice-letter": {
    title: "رسالة إشعار",
    description: "إشعار رسمي بمدة ما قبل المغادرة.",
  },
  "formal-complaint-employer": {
    title: "مراسلة تظلم للمشغل",
    description: "نموذج لإشعار رسمي بوجود إخلال.",
  },
  "overtime-claim-letter": {
    title: "طلب أداء الساعات الإضافية",
    description: "رسالة للمطالبة بمستحقات الساعات الإضافية.",
  },
  "salary-recovery-letter": {
    title: "طلب استرجاع الأجر غير المؤدى",
    description: "رسالة مطالبة بالأجور غير المصروفة.",
  },
  "contract-renewal-request": {
    title: "طلب تجديد العقد",
    description: "نموذج لطلب تمديد أو تجديد CDD.",
  },
  "employment-certificate-request": {
    title: "طلب شهادة عمل",
    description: "نموذج طلب شهادة مهنية.",
  },
  "cnss-complaint-letter": {
    title: "تظلم CNSS",
    description: "نموذج تظلم بخصوص التصريح أو الملف لدى CNSS.",
  },
  "labor-inspector-complaint": {
    title: "شكاية إلى مفتشية الشغل",
    description: "نموذج لإيداع ملف لدى مفتشية الشغل.",
  },
  "work-accident-declaration": {
    title: "تصريح بحادثة شغل",
    description: "نموذج تصريح بحادث مهني.",
  },
  "maternity-leave-request": {
    title: "طلب عطلة أمومة",
    description: "طلب رسمي لعطلة الأمومة.",
  },
  "unpaid-leave-request": {
    title: "طلب عطلة بدون أجر",
    description: "نموذج طلب عطلة استثنائية غير مؤدى عنها.",
  },
  "harassment-report-letter": {
    title: "تبليغ عن تحرش",
    description: "رسالة تبليغ داخلية عن سلوك غير لائق.",
  },
  "mutual-termination-proposal": {
    title: "اقتراح إنهاء ودي",
    description: "اقتراح إنهاء العلاقة الشغلية بالتراضي.",
  },
};

const generatorGroups: GeneratorGroup[] = [
  {
    titleKey: "documentsPage.groupDepartureTitle",
    subtitleKey: "documentsPage.groupDepartureSubtitle",
    templateIds: [
      "resignation-letter",
      "notice-letter",
      "mutual-termination-proposal",
      "contract-renewal-request",
    ],
  },
  {
    titleKey: "documentsPage.groupDisputesTitle",
    subtitleKey: "documentsPage.groupDisputesSubtitle",
    templateIds: [
      "formal-complaint-employer",
      "overtime-claim-letter",
      "salary-recovery-letter",
      "labor-inspector-complaint",
      "harassment-report-letter",
    ],
  },
  {
    titleKey: "documentsPage.groupAdminTitle",
    subtitleKey: "documentsPage.groupAdminSubtitle",
    templateIds: ["employment-certificate-request"],
  },
  {
    titleKey: "documentsPage.groupSocialTitle",
    subtitleKey: "documentsPage.groupSocialSubtitle",
    templateIds: [
      "cnss-complaint-letter",
      "work-accident-declaration",
      "maternity-leave-request",
      "unpaid-leave-request",
    ],
  },
];

function templatesById(templateIds: string[], allTemplates: DocumentTemplate[]) {
  return templateIds
    .map((templateId) => allTemplates.find((template) => template.id === templateId))
    .filter((template): template is DocumentTemplate => Boolean(template));
}

export default function DocumentsPage() {
  const { t, language } = useLanguage();
  const [allTemplates, setAllTemplates] = useState<DocumentTemplate[]>([]);

  useEffect(() => {
    let active = true;
    fetch("/api/documents/templates", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { ok?: boolean; items?: DocumentTemplate[] }) => {
        if (!active || !data.ok || !data.items) return;
        setAllTemplates(data.items);
      })
      .catch(() => { });
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="paper-bg min-h-screen">
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-10 pt-6 sm:px-6">
        <section className="soft-card rounded-[2rem] p-6 sm:p-8">
          <p className="section-kicker">{t("documentsPage.kicker")}</p>
          <h1 className="display-font mt-2 break-words text-4xl font-semibold leading-tight sm:text-5xl">
            {t("documentsPage.title")}
          </h1>
          <p className="mt-3 max-w-2xl break-words text-sm leading-relaxed text-[var(--ink-soft)]">
            {t("documentsPage.description")}
          </p>
        </section>

        <section className="mt-5">
          <p className="section-kicker pl-1">{t("common.partner")}</p>
          <div className="mt-2">
            <ReviewlyPromoCard type="transition" />
          </div>
        </section>

        <div className="mt-5 space-y-5">
          {generatorGroups.map((group, groupIndex) => {
            const templates = templatesById(group.templateIds, allTemplates);

            return (
              <section
                key={group.titleKey}
                className={`min-w-0 rounded-3xl p-5 ${groupIndex % 2 === 0 ? "soft-card" : "panel-strong border border-[var(--line)]"}`}
              >
                <div className="mb-4">
                  <p className="section-kicker">{t(group.titleKey)}</p>
                  <p className="mt-1 break-words text-sm text-[var(--ink-soft)]">
                    {t(group.subtitleKey)} ({t("documentsPage.modelsCount", { count: templates.length })})
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {templates.map((template, index) => (
                    <article
                      key={template.id}
                      className={`min-w-0 rounded-2xl p-4 ${index % 2 === 0 ? "soft-card" : "panel-strong border border-[var(--line)]"}`}
                    >
                      <h2 className="display-font break-words text-xl font-semibold leading-tight">
                        {language === "ar" ? templateArabicLabels[template.id]?.title ?? template.title : template.title}
                      </h2>
                      <p className="mt-2 break-words text-sm leading-relaxed text-[var(--ink-soft)]">
                        {language === "ar" ? templateArabicLabels[template.id]?.description ?? template.description : template.description}
                      </p>
                      <Link href={template.href} className="btn-primary mt-4 px-4 py-2 text-sm">
                        {t("documentsPage.openTemplate")}
                      </Link>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <section className="mt-5">
          <p className="section-kicker pl-1">{t("common.partner")}</p>
          <div className="soft-card mt-2 rounded-3xl p-3">
            <AdSlot slot="8888888888" format="auto" />
          </div>
        </section>
      </div>
    </main>
  );
}
