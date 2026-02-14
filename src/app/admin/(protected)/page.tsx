import { listArticles } from "@/lib/server/articles-store";
import { readAdminConfig } from "@/lib/server/admin-config";
import { listDocuments, listSimulations } from "@/lib/server/app-store";
import { listDocumentTemplatesWithOptions } from "@/lib/server/document-templates-store";
import { AdminHealthCheck } from "@/components/admin-health-check";

export default async function AdminDashboardPage() {
  const [simulations, documents, config, articles, documentTemplates] = await Promise.all([
    listSimulations(),
    listDocuments(),
    readAdminConfig(),
    listArticles(),
    listDocumentTemplatesWithOptions({ includeInactive: true }),
  ]);

  const stats = [
    { label: "Simulations enregistrees", value: simulations.length.toString() },
    { label: "Documents enregistres", value: documents.length.toString() },
    { label: "Articles total", value: articles.length.toString() },
    { label: "Modeles documents", value: documentTemplates.length.toString() },
  ];
  const recentSimulations = simulations.slice(0, 7);
  const recentDocuments = documents.slice(0, 7);
  const topCalculators = Object.entries(
    simulations.reduce<Record<string, number>>((acc, current) => {
      acc[current.calculatorType] = (acc[current.calculatorType] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-4">
      <section className="soft-card rounded-3xl p-5">
        <p className="section-kicker">Overview</p>
        <h2 className="display-font mt-1 text-3xl font-semibold">Tableau de bord operationnel</h2>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Config mise a jour le {new Date(config.updatedAt).toLocaleString("fr-MA")}.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <article
            key={stat.label}
            className={`rounded-2xl p-4 ${index % 2 === 0 ? "soft-card" : "panel-strong border border-[var(--line)]"}`}
          >
            <p className="text-xs uppercase tracking-[0.12em] text-[var(--ink-soft)]">{stat.label}</p>
            <p className="display-font mt-2 text-3xl font-semibold">{stat.value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        <article className="soft-card rounded-3xl p-5">
          <p className="section-kicker">Recents</p>
          <p className="display-font mt-2 text-3xl font-semibold">{recentSimulations.length}</p>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">Dernieres simulations</p>
        </article>
        <article className="soft-card rounded-3xl p-5">
          <p className="section-kicker">Recents</p>
          <p className="display-font mt-2 text-3xl font-semibold">{recentDocuments.length}</p>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">Derniers documents generes</p>
        </article>
        <article className="soft-card rounded-3xl p-5">
          <p className="section-kicker">Maintenance</p>
          <p className="mt-2 text-sm font-semibold">
            {config.maintenanceMessage ? "Message actif" : "Aucun message"}
          </p>
          <p className="mt-1 text-xs text-[var(--ink-soft)]">
            {config.maintenanceMessage ? config.maintenanceMessage : "Le site est en mode normal."}
          </p>
        </article>
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <article className="soft-card rounded-3xl p-5">
          <h3 className="display-font text-2xl font-semibold">Etat des outils</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="panel-strong rounded-xl p-3 text-sm">
              <p className="font-semibold">Ads Simulateurs</p>
              <p className="mt-1 text-[var(--ink-soft)]">
                {config.simulatorAdStepEnabled ? "Activees" : "Desactivees"}
              </p>
            </div>
            <div className="panel-strong rounded-xl p-3 text-sm">
              <p className="font-semibold">Ads Generateurs</p>
              <p className="mt-1 text-[var(--ink-soft)]">
                {config.documentAdStepEnabled ? "Activees" : "Desactivees"}
              </p>
            </div>
          </div>
        </article>

        <article className="soft-card rounded-3xl p-5">
          <h3 className="display-font text-2xl font-semibold">Top simulateurs</h3>
          <div className="mt-3 space-y-2">
            {topCalculators.length === 0 ? (
              <p className="text-sm text-[var(--ink-soft)]">Aucune simulation enregistree pour le moment.</p>
            ) : (
              topCalculators.map(([calculator, count]) => (
                <div key={calculator} className="panel-strong rounded-xl p-3 text-sm">
                  <p className="font-semibold">{calculator}</p>
                  <p className="mt-1 text-[var(--ink-soft)]">{count} executions</p>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <AdminHealthCheck />
    </div>
  );
}
