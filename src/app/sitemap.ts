import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { listArticles } from "@/lib/server/articles-store";
import { listDocumentTemplates } from "@/lib/server/document-templates-store";

const staticPages = [
  "",
  "/simulate",
  "/documents",
  "/bibliotheque",
  "/tools",
  "/tools/payslip-detector",
  "/tools/salary-delay-alert",
  "/tools/compliance-risk-score",
  "/journal/overtime",
  "/journal/violations",
  "/simulate/net-gross",
  "/simulate/employer-total-cost",
  "/simulate/annual-income-tax",
  "/simulate/licenciement",
  "/simulate/demission",
  "/simulate/fin-cdd",
  "/simulate/probation-termination",
  "/simulate/seniority-growth",
  "/simulate/leave-accrual",
  "/simulate/smig-compliance",
  "/simulate/overtime",
  "/simulate/public-holiday-compensation",
  "/simulate/maternity-leave",
  "/simulate/sick-leave",
  "/simulate/cnss-pension",
  "/simulate/work-accident",
  "/simulate/harassment-scenario",
  "/simulate/unpaid-salary-recovery",
  "/simulate/unpaid-overtime-recovery",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [articles, documentTemplates] = await Promise.all([
    listArticles(),
    listDocumentTemplates(),
  ]);
  const publicArticles = articles.filter(
    (article) => (article.isActive ?? true) && (article.access ?? "public") === "public",
  );

  const staticEntries: MetadataRoute.Sitemap = staticPages.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "daily" : path.startsWith("/journal") ? "daily" : "weekly",
    priority: path === "" ? 1 : path.startsWith("/simulate/") ? 0.85 : 0.8,
  }));

  const articleEntries: MetadataRoute.Sitemap = publicArticles.map((article) => ({
    url: `${SITE_URL}${article.href}`,
    lastModified: new Date(article.lastUpdated),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const documentEntries: MetadataRoute.Sitemap = documentTemplates.map((template) => ({
    url: `${SITE_URL}${template.href}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.65,
  }));

  return [...staticEntries, ...articleEntries, ...documentEntries];
}
