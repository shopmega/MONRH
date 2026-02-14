import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { listArticles } from "@/lib/server/articles-store";
import { listDocumentTemplates } from "@/lib/server/document-templates-store";

const staticPages = [
  "",
  "/simulateurs",
  "/documents",
  "/bibliotheque",
  "/outils",
  "/outils/detecteur-fiche-paie",
  "/outils/alerte-retard-salaire",
  "/outils/score-risque-conformite",
  "/journal/overtime",
  "/journal/violations",
  "/simulateurs/brut-net",
  "/simulateurs/cout-employeur-total",
  "/simulateurs/ir-annuel",
  "/simulateurs/licenciement",
  "/simulateurs/demission",
  "/simulateurs/fin-cdd",
  "/simulateurs/rupture-periode-essai",
  "/simulateurs/progression-anciennete",
  "/simulateurs/acquisition-conges",
  "/simulateurs/conformite-smig",
  "/simulateurs/heures-supplementaires",
  "/simulateurs/compensation-jours-feries",
  "/simulateurs/conge-maternite",
  "/simulateurs/conge-maladie",
  "/simulateurs/pension-cnss",
  "/simulateurs/accident-travail",
  "/simulateurs/scenario-harcelement",
  "/simulateurs/recouvrement-salaire-impaye",
  "/simulateurs/recouvrement-heures-supplementaires",
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
    priority: path === "" ? 1 : path.startsWith("/simulateurs/") ? 0.85 : 0.8,
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
