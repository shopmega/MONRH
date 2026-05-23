import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { EmployerDataBootstrapClient } from "@/components/employer/employer-data-bootstrap-client";
import { EmployerWorkspaceNav } from "@/components/employer/employer-workspace-nav";
import { isUserAuthenticated } from "@/lib/server/user-session";

export default async function EmployerLayout({ children }: { children: ReactNode }) {
  const authenticated = await isUserAuthenticated();
  if (!authenticated) {
    redirect("/connexion?next=/employer");
  }

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="grid min-h-screen lg:grid-cols-[292px_minmax(0,1fr)]">
        <aside className="hidden border-r border-[var(--line)] bg-[var(--surface)] lg:block">
          <div className="sticky top-0 h-screen overflow-y-auto p-5">
            <EmployerWorkspaceNav variant="sidebar" />
          </div>
        </aside>

        <div className="min-w-0 px-4 pb-14 pt-4 sm:px-6 lg:px-8 lg:pt-8">
          <div className="lg:hidden">
            <EmployerWorkspaceNav variant="mobile" />
          </div>
          <div className="mx-auto w-full max-w-7xl">
            <EmployerDataBootstrapClient>{children}</EmployerDataBootstrapClient>
          </div>
        </div>
      </div>
    </main>
  );
}
