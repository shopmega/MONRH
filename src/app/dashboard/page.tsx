import type { Metadata } from 'next';
import { isUserAuthenticated } from '@/lib/server/user-session';
import { redirect } from 'next/navigation';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { SITE_NAME } from '@/lib/seo';

export const metadata: Metadata = {
  title: `Mon Espace Travailleur | ${SITE_NAME}`,
  description: 'Votre poste de commande RH : simulations, documents et intelligence marché Avisine.',
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const authenticated = await isUserAuthenticated();
  
  if (!authenticated) {
    redirect('/connexion?next=/dashboard');
  }

  return (
    <main className="paper-bg min-h-screen">
      <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-6 sm:px-6">
        <header className="mb-8">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-[var(--accent)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
            Espace Integré
          </div>
          <h1 className="display-font mt-2 text-4xl font-black tracking-tight sm:text-5xl">
            Mon Poste de Commande
          </h1>
          <p className="mt-2 text-sm text-[var(--ink-soft)] max-w-2xl">
            Consultez vos droits, gérez vos documents et suivez vos analyses d'opportunités Avisine en un seul endroit.
          </p>
        </header>

        <DashboardClient />
      </div>
    </main>
  );
}
