"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard", description: "Vue globale" },
  { href: "/admin/activity", label: "Activity", description: "Historique recent" },
  { href: "/admin/articles", label: "Articles", description: "Creation et edition" },
  { href: "/admin/linking", label: "Linking", description: "Liens contextuels" },
  { href: "/admin/rules", label: "Rules", description: "Taxes et legal versions" },
  { href: "/admin/tools", label: "Tools", description: "Configuration runtime" },
  { href: "/admin/audit", label: "Audit", description: "Journaux et snapshots" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/user/session", { method: "DELETE" });
    window.dispatchEvent(new Event("salarie-auth-changed"));
    router.push("/connexion?next=/admin");
    router.refresh();
  }

  return (
    <main className="paper-bg min-h-screen">
      <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-6 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start">
          <aside className="space-y-4 lg:sticky lg:top-6">
            <section className="soft-card rounded-3xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="section-kicker">Admin Console</p>
                  <h1 className="display-font mt-1 text-2xl font-semibold">SIMULIO Backoffice</h1>
                </div>
                <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent)]">
                  Secure
                </span>
              </div>

              <nav className="mt-4 space-y-2">
                {ADMIN_NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block rounded-2xl border px-3 py-2.5 transition ${
                      pathname === item.href
                        ? "border-transparent bg-[var(--accent)] text-white"
                        : "border-[var(--line)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-strong)]"
                    }`}
                  >
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p
                      className={`mt-0.5 text-xs ${
                        pathname === item.href ? "text-white/90" : "text-[var(--ink-soft)]"
                      }`}
                    >
                      {item.description}
                    </p>
                  </Link>
                ))}
              </nav>

              <button type="button" onClick={logout} className="btn-muted mt-4 w-full px-4 py-2 text-sm">
                Deconnexion
              </button>
            </section>
          </aside>

          <section className="space-y-4">
            <section className="soft-card rounded-3xl p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="section-kicker">Workspace</p>
                  <p className="text-sm text-[var(--ink-soft)]">
                    Suivi de contenu, simulations et configuration produit.
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--ink-soft)]">
                  Path: {pathname}
                </div>
              </div>
            </section>

            <div>{children}</div>
          </section>
        </div>
      </div>
    </main>
  );
}
