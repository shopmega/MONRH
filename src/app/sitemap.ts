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
  "/simulateurs/brut-net",
  "/simulateurs/ir-annuel",
  "/simulateurs/cout-employeur-total",
  "/simulateurs/conformite-smig",
  "/simulateurs/licenciement",
  "/simulateurs/demission",
  "/simulateurs/duree-preavis",
  "/simulateurs/fin-cdd",
  "/simulateurs/rupture-periode-essai",
  "/simulateurs/progression-anciennete",
  "/simulateurs/acquisition-conges",
  "/simulateurs/heures-supplementaires",
  "/simulateurs/compensation-jours-feries",
  "/simulateurs/conge-maternite",
  "/simulateurs/conge-maladie",
  "/simulateurs/pension-cnss",
  "/simulateurs/accident-travail",
  "/simulateurs/scenario-harcelement",
  "/simulateurs/recouvrement-salaire-impaye",
  "/simulateurs/recouvrement-heures-supplementaires",
  "/planifier",
  "/documents",
  "/bibliotheque",
  "/outils",
  "/outils/detecteur-fiche-paie",
  "/outils/alerte-retard-salaire",
  "/outils/score-risque-conformite",
  "/outils/audit-solde-tout-compte",
  "/outils/controle-procedure-disciplinaire",
  "/outils/risque-requalification-cdd",
  "/outils/feuille-route-pre-contentieux",
  "/journal/overtime",
  "/journal/violations",
  "/salaire/brut-net",
  "/salaire/ir-igr",
  "/salaire/smig-smag",
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
  "/conges-cnss/pension-cnss",
  "/conges-cnss/accident-travail",
  "/litiges/salaire-impaye",
  "/litiges/heures-sup-impayees",
  "/litiges/harcelement",
  "/planifier/comparaison-scenarios",
  "/planifier/augmentation-salaire",
  "/planifier/simulation-prime",
  "/planifier/igr-detail",
  "/planifier/avantages-nature",
  "/planifier/scenario-promotion",
  "/planifier/freelance-vs-salarie",
  "/planifier/capacite-credit",
  "/planifier/indemnite-chomage",
  "/planifier/retraite-avancee",
  "/planifier/bulletin-paie",
  "/planifier/masse-salariale",
  "/planifier/cout-recrutement",
  "/planifier/optimisation-remuneration",
  "/planifier/auto-entrepreneur",
  "/planifier/tarification-freelance",
  "/planifier/benefice-net",
  "/rh-pro/cout-employeur-total",
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
          : path === "/simulateurs" || path === "/planifier" || path === "/documents" || path === "/bibliotheque"
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
              path.startsWith("/carriere/") ||
              path.startsWith("/planifier/")
            ? 0.85
            : path.startsWith("/rh-pro/")
              ? 0.7
            : path.startsWith("/simulateurs/") ||
                path === "/simulateurs" ||
                path === "/planifier" ||
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
