import Link from "next/link";

const footerLinks = [
  { href: "/simulateurs", label: "Simulateurs" },
  { href: "/outils", label: "Outils" },
  { href: "/articles", label: "Articles" },
  { href: "/modeles", label: "Modeles" },
  { href: "/documents", label: "Documents" },
  { href: "/about", label: "A propos" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Confidentialite" },
  { href: "/terms", label: "Conditions" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--line)] bg-[var(--surface)]">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-5 py-8 text-sm text-[var(--ink-soft)] sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:px-8">
        <div className="min-w-0">
          <p className="display-font text-xl font-semibold text-[var(--heading)]">TON RH</p>
          <p className="mt-2 max-w-2xl leading-6">
            Jurisconsult en droit du travail marocain: simulateurs, outils de controle, guides et modeles utiles.
          </p>
        </div>
        <nav className="flex flex-wrap gap-3 lg:justify-end" aria-label="Liens de pied de page">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full bg-[var(--surface-muted)] px-4 py-2 font-semibold text-[var(--foreground)] transition hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-[var(--line)] pt-4 text-xs lg:col-span-2">
          <p>2026 TON RH. Informations indicatives, a verifier selon votre situation.</p>
        </div>
      </div>
    </footer>
  );
}
