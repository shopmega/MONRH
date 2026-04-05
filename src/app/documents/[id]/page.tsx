import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/ad-slot";
import { DocumentGeneratorFormClient } from "@/components/document-generator-form-client";
import { RelatedContent } from "@/components/related-content";
import { resolveRelatedItems } from "@/lib/linking/resolve-related";
import { SITE_NAME, buildOgImageUrl } from "@/lib/seo";
import { readAdminConfig } from "@/lib/server/admin-config";
import { getDocumentTemplateById, listDocumentTemplates } from "@/lib/server/document-templates-store";
import { isUserAuthenticated } from "@/lib/server/user-session";

export async function generateStaticParams() {
  const templates = await listDocumentTemplates();
  return templates.map((template) => ({ id: template.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const template = await getDocumentTemplateById(id);
  if (!template) {
    return {};
  }

  const config = await readAdminConfig();
  const siteName = config.websiteSettings.siteName.trim() || SITE_NAME;
  const imageUrl = buildOgImageUrl(template.title, template.description, siteName);
  return {
    title: template.title,
    description: template.description,
    alternates: {
      canonical: template.href,
      languages: {
        "fr-MA": template.href,
        "ar-MA": template.href,
        "x-default": template.href,
      },
    },
    openGraph: {
      type: "article",
      title: `${template.title} | Modele`,
      description: template.description,
      url: template.href,
      siteName,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: template.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: template.title,
      description: template.description,
      images: [imageUrl],
    },
  };
}

export default async function DocumentGeneratorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const template = await getDocumentTemplateById(id);
  const userAuthenticated = await isUserAuthenticated();
  const mappedItems = await resolveRelatedItems({
    sourceType: "document",
    sourceId: id,
    userAuthenticated,
  });
  const language = (await cookies()).get("salarie_language")?.value === "ar" ? "ar" : "fr";
  const labels =
    language === "ar"
      ? {
          generator: "مولد",
          partner: "شريك",
          moreGenerators: "مولدات إضافية",
          moreGeneratorsDesc: "اكتشف نماذج أخرى من الرسائل المهنية.",
          simulators: "محاكيات",
          simulatorsDesc: "قدّر مبالغك قبل صياغة المراسلة.",
          practicalArticles: "مقالات عملية",
          practicalArticlesDesc: "راجع المقالات القانونية لتقوية ملفك.",
        }
      : {
          generator: "Modele",
          partner: "Partenaire",
          moreGenerators: "Plus de modeles",
          moreGeneratorsDesc: "Explorez d'autres modeles de lettres professionnelles.",
          simulators: "Outils lies",
          simulatorsDesc: "Verifiez vos montants ou vos droits avant de rediger votre courrier.",
          practicalArticles: "Articles pratiques",
          practicalArticlesDesc: "Consultez les articles pour mieux cadrer votre demande.",
        };

  if (!template) {
    notFound();
  }

  const initialValues = Object.fromEntries(
    template.fields.map((field) => {
      const raw = query[field.id];
      const value = Array.isArray(raw) ? raw[0] : raw;
      return [field.id, typeof value === "string" ? value : ""];
    }),
  );
  const rawCaseId = query.caseId;
  const caseId = Array.isArray(rawCaseId) ? rawCaseId[0] : rawCaseId;

  return (
    <main className="paper-bg min-h-screen">
      <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-6 sm:px-6">
        <section className="soft-card rounded-[2rem] p-5 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-soft)]">
            {labels.generator}
          </p>
          <h1 className="display-font mt-2 break-words text-3xl font-semibold sm:text-4xl">
            {template.title}
          </h1>
          <p className="mt-2 break-words text-sm text-[var(--ink-soft)]">{template.description}</p>
        </section>
        <section className="mt-5">
          <p className="section-kicker pl-1">{labels.partner}</p>
          <div className="soft-card mt-2 rounded-3xl p-3">
            <AdSlot slot="1212121212" format="auto" />
          </div>
        </section>
        <DocumentGeneratorFormClient
          template={template}
          initialValues={initialValues}
          caseId={typeof caseId === "string" ? caseId : undefined}
        />
        <RelatedContent
          items={
            mappedItems.length > 0
              ? mappedItems
              : [
                  {
                    title: labels.moreGenerators,
                    description: labels.moreGeneratorsDesc,
                    href: "/modeles",
                  },
                  {
                    title: labels.simulators,
                    description: labels.simulatorsDesc,
                    href: "/salaire",
                  },
                  {
                    title: labels.practicalArticles,
                    description: labels.practicalArticlesDesc,
                    href: "/articles",
                  },
                ]
          }
        />
      </div>
    </main>
  );
}
