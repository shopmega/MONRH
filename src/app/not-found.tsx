import Link from "next/link";

export default function NotFound() {
  return (
    <main className="paper-bg min-h-screen px-4 pb-12 pt-28 sm:px-6">
      <section className="soft-card mx-auto flex min-h-[58vh] w-full max-w-3xl flex-col items-center justify-center rounded-[2rem] p-8 text-center">
        <p className="section-kicker">Page introuvable</p>
        <h1 className="display-font mt-3 text-4xl font-semibold leading-tight sm:text-5xl">
          Cette page n&apos;existe pas
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--ink-soft)] sm:text-base">
          Le lien a peut-etre change ou la page recherchee n&apos;est plus disponible.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-primary min-h-11 rounded-lg px-6 py-0 text-sm">
            Retour a l&apos;accueil
          </Link>
          <Link href="/articles" className="btn-muted min-h-11 rounded-lg px-6 py-0 text-sm">
            Voir les articles
          </Link>
        </div>
      </section>
    </main>
  );
}
