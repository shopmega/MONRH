import { listDocuments, listSimulations } from "@/lib/server/app-store";
import { listOvertimeLogs, listViolationLogs } from "@/lib/server/protection-store";

export default async function AdminActivityPage() {
  const [simulations, documents, violations, overtimeLogs] = await Promise.all([
    listSimulations(),
    listDocuments(),
    listViolationLogs(),
    listOvertimeLogs(),
  ]);
  const simulationRows = simulations.slice(0, 15);
  const documentRows = documents.slice(0, 15);
  const toolRows = [
    ...violations.map((row) => ({
      id: `v-${row.id}`,
      createdAt: row.createdAt,
      label: `Violation: ${row.type}`,
    })),
    ...overtimeLogs.map((row) => ({
      id: `o-${row.id}`,
      createdAt: row.createdAt,
      label: "Overtime Journal",
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 15);

  return (
    <div className="space-y-4">
      <section className="soft-card rounded-3xl p-5">
        <p className="section-kicker">Activity</p>
        <h2 className="display-font mt-1 text-3xl font-semibold">Historique recent</h2>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Dernieres executions des simulateurs et generations de documents.
        </p>
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        <article className="soft-card rounded-3xl p-5">
          <h3 className="display-font text-2xl font-semibold">Simulations</h3>
          <div className="mt-3 space-y-2">
            {simulationRows.length === 0 ? (
              <p className="text-sm text-[var(--ink-soft)]">Aucune simulation enregistree.</p>
            ) : (
              simulationRows.map((row) => (
                <div key={row.id} className="panel-strong rounded-xl p-3">
                  <p className="text-sm font-semibold">{row.calculatorType}</p>
                  <p className="mt-1 text-xs text-[var(--ink-soft)]">
                    {new Date(row.createdAt).toLocaleString("fr-MA")}
                  </p>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="soft-card rounded-3xl p-5">
          <h3 className="display-font text-2xl font-semibold">Documents</h3>
          <div className="mt-3 space-y-2">
            {documentRows.length === 0 ? (
              <p className="text-sm text-[var(--ink-soft)]">Aucun document enregistre.</p>
            ) : (
              documentRows.map((row) => (
                <div key={row.id} className="panel-strong rounded-xl p-3">
                  <p className="text-sm font-semibold">{row.templateTitle}</p>
                  <p className="mt-1 text-xs text-[var(--ink-soft)]">
                    {new Date(row.createdAt).toLocaleString("fr-MA")}
                  </p>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="soft-card rounded-3xl p-5">
          <h3 className="display-font text-2xl font-semibold">Outils journalises</h3>
          <div className="mt-3 space-y-2">
            {toolRows.length === 0 ? (
              <p className="text-sm text-[var(--ink-soft)]">Aucune activite outils enregistree.</p>
            ) : (
              toolRows.map((row) => (
                <div key={row.id} className="panel-strong rounded-xl p-3">
                  <p className="text-sm font-semibold">{row.label}</p>
                  <p className="mt-1 text-xs text-[var(--ink-soft)]">
                    {new Date(row.createdAt).toLocaleString("fr-MA")}
                  </p>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
