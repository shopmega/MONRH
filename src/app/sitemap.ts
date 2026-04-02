import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { listArticles } from "@/lib/server/articles-store";
import { listDocumentTemplates } from "@/lib/server/document-templates-store";
import { seoGuides } from "@/data/seo-guides";

const staticPages = [
  "",
  "/salaire",
  "/contrat-depart",
  "/conges-cnss",
  "/litiges",
  "/modeles",
  "/carriere",
  "/rh-pro",
  "/articles",
  "/simulateurs",
  "/documents",
  "/bibliotheque",
  "/outils",
  "/outils/detecteur-fiche-paie",
  "/outils/alerte-retard-salaire",
  "/outils/score-risque-conformite",
  "/journal/overtime",
  "/journal/violations",
  "/salaire/brut-net",
  "/salaire/ir-igr",
  "/salaire/prime-bonus",
  "/salaire/avantages-nature",
  "/salaire/smig-smag",
  "/salaire/bulletin-paie",
  "/salaire/optimisation-remuneration",
  "/contrat-depart/licenciement",
  "/contrat-depart/demission",
  "/contrat-depart/duree-preavis",
  "/contrat-depart/fin-cdd",
  "/contrat-depart/periode-essai",
  "/contrat-depart/anciennete-indemnites",
  "/conges-cnss/conges-acquis",
  "/conges-cnss/heures-supplementaires",
  "/conges-cnss/jour-ferie",
  "/conges-cnss/arret-maladie",
  "/conges-cnss/conge-maternite",
  "/conges-cnss/indemnite-chomage",
  "/conges-cnss/pension-cnss",
  "/conges-cnss/retraite-cnss",
  "/conges-cnss/accident-travail",
  "/litiges/salaire-impaye",
  "/litiges/heures-sup-impayees",
  "/litiges/harcelement",
  "/carriere/comparaison-scenarios",
  "/carriere/augmentation-salaire",
  "/carriere/promotion",
  "/carriere/freelance-vs-salarie",
  "/carriere/capacite-credit",
  "/carriere/auto-entrepreneur",
  "/carriere/tarification-freelance",
  "/carriere/benefice-net",
  "/rh-pro/cout-employeur-total",
  "/rh-pro/masse-salariale",
  "/rh-pro/cout-recrutement",
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
    changeFrequency:
      path === ""
        ? "daily"
        : path.startsWith("/journal")
          ? "daily"
          : path === "/simulateurs" || path === "/documents" || path === "/bibliotheque"
            ? "monthly"
            : "weekly",
    priority:
      path === ""
        ? 1
        : path === "/salaire" ||
            path === "/contrat-depart" ||
            path === "/conges-cnss" ||
            path === "/litiges" ||
            path === "/modeles" ||
            path === "/articles"
          ? 0.9
          : path.startsWith("/salaire/") ||
              path.startsWith("/contrat-depart/") ||
              path.startsWith("/conges-cnss/") ||
              path.startsWith("/litiges/") ||
              path.startsWith("/carriere/")
            ? 0.85
            : path.startsWith("/rh-pro/")
              ? 0.7
            : path.startsWith("/simulateurs/") ||
                path === "/simulateurs" ||
                path === "/documents" ||
                path === "/bibliotheque"
              ? 0.45
              : 0.75,
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

  const guideEntries: MetadataRoute.Sitemap = seoGuides.map((guide) => ({
    url: `${SITE_URL}/sujets/${guide.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticEntries, ...articleEntries, ...documentEntries, ...guideEntries];
}
