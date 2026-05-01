import Link from "next/link";

const footerSections = [
  {
    title: "Produit",
    links: [
      { href: "/simulateurs", label: "Simulateurs" },
      { href: "/outils", label: "Outils" },
      { href: "/documents", label: "Documents" },
      { href: "/modeles", label: "Modeles" },
    ],
  },
  {
    title: "Ressources",
    links: [
      { href: "/articles", label: "Articles" },
      { href: "/bibliotheque", label: "Bibliotheque" },
      { href: "/sujets/calcul-indemnite-licenciement-maroc", label: "Guides pratiques" },
    ],
  },
  {
    title: "Entreprise",
    links: [
      { href: "/about", label: "A propos" },
      { href: "/contact", label: "Contact" },
      { href: "/privacy", label: "Confidentialite" },
      { href: "/terms", label: "Conditions" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--line)] bg-[var(--surface)]">
      <div className="mx-auto w-full max-w-7xl px-5 py-10 text-sm text-[var(--ink-soft)] sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)]">
          <div className="min-w-0">
            <p className="display-font text-2xl font-semibold text-[var(--heading)]">TON RH</p>
            <p className="mt-3 max-w-xl leading-7">
              Jurisconsult en droit du travail marocain: simulateurs, outils de controle, guides et modeles utiles.
            </p>
            <p className="mt-4 max-w-xl text-xs leading-6">
              Informations indicatives, a verifier selon votre contrat, votre bulletin et votre situation.
            </p>
          </div>

          <nav
            className="grid gap-7 sm:grid-cols-3"
            aria-label="Liens de pied de page"
          >
            {footerSections.map((section) => (
              <div key={section.title}>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--heading)]">
                  {section.title}
                </p>
                <ul className="mt-3 space-y-2.5">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="inline-flex text-sm text-[var(--ink-soft)] underline-offset-4 transition hover:text-[var(--accent)] hover:underline"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-[var(--line)] pt-5 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>2026 TON RH. Tous droits reserves.</p>
          <p>
            TON RH ne remplace pas un conseil juridique, fiscal ou social personnalise.
          </p>
        </div>
      </div>
    </footer>
  );
}
