import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/server/user-session";
import { listEmploymentVerifications } from "@/lib/server/verification-store";

export default async function CompteVerificationsPage() {
  const userId = await getCurrentUserId();
  if (!userId) {
    redirect("/connexion?next=/compte/verifications");
  }

  const items = await listEmploymentVerifications(userId, { limit: 100 });

  return (
    <main className="paper-bg min-h-screen">
      <div className="mx-auto w-full max-w-5xl px-4 pb-10 pt-6 sm:px-6">
        <section className="soft-card rounded-[2rem] p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="section-kicker">Mon dossier</p>
              <h1 className="display-font mt-2 text-3xl font-semibold sm:text-4xl">Mes verifications</h1>
              <p className="mt-2 text-sm text-[var(--ink-soft)]">
                Suivi des verifications d'emploi creees depuis vos documents et dossiers.
              </p>
            </div>
            <Link href="/compte" className="btn-muted px-4 py-2 text-xs uppercase tracking-[0.12em]">
              Retour compte
            </Link>
          </div>
        </section>

        <section className="mt-5 space-y-3">
          {items.length === 0 ? (
            <section className="soft-card rounded-3xl p-5 text-sm text-[var(--ink-soft)]">
              Aucune verification pour le moment.
            </section>
          ) : (
            items.map((item) => (
              <article key={item.id} className="soft-card rounded-3xl p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="section-kicker">Verification</p>
                    <h2 className="display-font mt-1 text-2xl font-semibold">{item.companyName || item.companyId}</h2>
                    <p className="mt-1 text-sm text-[var(--ink-soft)]">
                      {item.sourceType} | Creee le {new Date(item.createdAt).toLocaleString("fr-MA")}
                    </p>
                  </div>
                  <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-semibold text-[var(--ink-soft)]">
                    {item.status}
                  </span>
                </div>
                {item.sourceCaseId ? (
                  <Link
                    href={`/compte/dossiers/${encodeURIComponent(item.sourceCaseId)}`}
                    className="mt-3 inline-flex text-sm font-semibold text-[var(--accent)]"
                  >
                    Ouvrir le dossier lie
                  </Link>
                ) : null}
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
