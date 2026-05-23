"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Calculator,
  CalendarClock,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  LockKeyhole,
  ShieldCheck,
  Users,
} from "lucide-react";
import { type Article, type Category } from "@/lib/content/home-content";

const employerModules = [
  { label: "Registre salaries", detail: "CIN, CNSS, contrats, documents", icon: Users },
  { label: "Paie Maroc", detail: "CNSS, AMO, IR, bulletins PDF", icon: Calculator },
  { label: "Conges & pointage", detail: "Soldes, demandes, heures sup", icon: CalendarClock },
  { label: "Declarations CNSS", detail: "Recaps et CSV Damancom", icon: FileSpreadsheet },
];

const publicTools = [
  { label: "Calcul brut net", href: "/salaire/brut-net", icon: Calculator },
  { label: "Bulletin de paie", href: "/planifier/bulletin-paie", icon: FileText },
  { label: "Contrat de travail", href: "/contrat", icon: BriefcaseBusiness },
  { label: "Modele de document", href: "/documents", icon: FileText },
];

const proofPoints = [
  "Regles paie marocaines structurees",
  "Exports et PDF gates cote serveur",
  "Donnees entreprise isolees par compte",
  "Portail employeur en cours de durcissement production",
];

function categoryName(slug: string, categories: Category[]) {
  return categories.find((category) => category.slug === slug)?.name ?? slug;
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--accent)]">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-black leading-tight text-[var(--heading)] sm:text-4xl">{title}</h2>
      {description ? <p className="mt-3 text-base leading-7 text-[var(--ink-soft)]">{description}</p> : null}
    </div>
  );
}

function ProductVisual() {
  return (
    <div className="relative min-h-[520px] overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--surface)] shadow-2xl shadow-black/10">
      <div className="flex items-center justify-between border-b border-[var(--line)] bg-[var(--surface-muted)] px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent)]">
            <Image src="/logo.svg" alt="SIMPAIE" width={22} height={22} />
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--accent)]">MONRH</p>
            <p className="text-sm font-black text-[var(--heading)]">Paie Mai 2026</p>
          </div>
        </div>
        <span className="rounded-lg bg-[var(--ok-bg)] px-3 py-1 text-xs font-black text-[var(--ok)]">Pret</span>
      </div>

      <div className="grid gap-4 p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["Salaries actifs", "24"],
            ["Masse brute", "286 400 MAD"],
            ["Net a payer", "214 980 MAD"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] p-4">
              <p className="text-xs font-bold text-[var(--ink-soft)]">{label}</p>
              <p className="mt-2 text-xl font-black text-[var(--heading)]">{value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="font-black text-[var(--heading)]">Controle paie</p>
            <ShieldCheck className="h-5 w-5 text-[var(--accent)]" />
          </div>
          <div className="space-y-3">
            {[
              ["CNSS CT/LT", "Valide"],
              ["AMO et IR", "Calcule"],
              ["SMIG", "Aucun ecart"],
              ["Bulletins PDF", "Generation serveur"],
            ].map(([label, state]) => (
              <div key={label} className="flex items-center justify-between gap-4 rounded-lg bg-[var(--surface)] px-4 py-3">
                <span className="text-sm font-bold text-[var(--heading)]">{label}</span>
                <span className="text-xs font-black uppercase tracking-[0.12em] text-[var(--accent)]">{state}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-[var(--accent-dark)] p-4 text-[var(--juris-on-primary)]">
            <p className="text-xs font-black uppercase tracking-[0.14em] opacity-75">Action</p>
            <p className="mt-2 text-lg font-black text-white">Declarer CNSS</p>
            <p className="mt-2 text-sm leading-6 opacity-80">CSV prepare depuis le run de paie.</p>
          </div>
          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--accent)]">Alertes</p>
            <p className="mt-2 text-lg font-black">2 a traiter</p>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">CDD et dossier RH incomplet.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HomePageClient({
  initialArticles,
  categories,
}: {
  initialArticles: Article[];
  categories: Category[];
}) {
  const latestArticles = initialArticles.slice(0, 3);

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <section className="border-b border-[var(--line)] bg-[var(--surface-muted)] pt-20">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_520px] lg:px-8 lg:py-16 xl:gap-16">
          <div className="flex min-w-0 flex-col justify-center">
            <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-[var(--accent)]">
              <BadgeCheck className="h-4 w-4" />
              SaaS RH et paie Maroc
            </div>
            <h1 className="mt-6 max-w-4xl text-4xl font-black leading-[1.03] text-[var(--heading)] sm:text-5xl lg:text-6xl">
              SIMPAIE centralise la paie, les RH et les obligations sociales des PME marocaines.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--ink-soft)]">
              Un espace employeur pour gerer les salaries, calculer la paie, preparer les bulletins et suivre les alertes
              de conformite. Les simulateurs publics restent disponibles pour les salaries et les professionnels RH.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/employer"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-6 text-sm font-black text-[var(--juris-on-primary)] transition hover:bg-[var(--accent-dark)]"
              >
                Ouvrir MONRH
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/simulate"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-6 text-sm font-black text-[var(--heading)] transition hover:bg-[var(--surface-strong)]"
              >
                Utiliser les simulateurs
              </Link>
            </div>

            <div className="mt-9 grid gap-3 sm:grid-cols-2">
              {proofPoints.map((point) => (
                <div key={point} className="flex items-start gap-3 rounded-lg bg-[var(--surface)] p-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--ok)]" />
                  <span className="text-sm font-bold leading-6 text-[var(--heading)]">{point}</span>
                </div>
              ))}
            </div>
          </div>

          <ProductVisual />
        </div>
      </section>

      <section className="border-b border-[var(--line)] bg-[var(--surface)]">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Portail employeur"
            title="Les operations RH critiques dans un seul espace."
            description="Le module MONRH couvre les parcours utiles avant facturation: registre salaries, paie, CNSS, contrats, conges, pointage, analytics et cabinet."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {employerModules.map((module) => {
              const Icon = module.icon;
              return (
                <div key={module.label} className="rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] p-5">
                  <Icon className="h-6 w-6 text-[var(--accent)]" />
                  <h3 className="mt-4 text-lg font-black text-[var(--heading)]">{module.label}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{module.detail}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--line)] bg-[var(--surface-muted)]">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:px-8">
          <SectionHeader
            eyebrow="Acces public"
            title="Des outils utiles sans ouvrir un dossier complet."
            description="Les simulateurs, modeles et guides restent le haut de funnel de SIMPAIE."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {publicTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link
                  key={tool.label}
                  href={tool.href}
                  className="group rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5 transition hover:border-[var(--accent)] hover:shadow-sm"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="font-black text-[var(--heading)]">{tool.label}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-[var(--accent)] transition group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[var(--surface)]">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeader
              eyebrow="Guides pratiques"
              title="Articles et reperes pour les cas RH courants."
              description="Conservez le trafic SEO existant tout en orientant les visiteurs vers le produit."
            />
            <Link href="/articles" className="inline-flex h-11 items-center justify-center rounded-lg border border-[var(--line)] px-4 text-sm font-black hover:bg-[var(--surface-muted)]">
              Tous les articles
            </Link>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {latestArticles.map((article) => (
              <Link
                key={article.slug}
                href={article.href}
                className="rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] p-5 transition hover:border-[var(--accent)]"
              >
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--accent)]">
                  {categoryName(article.categorySlug, categories)}
                </p>
                <h3 className="mt-3 text-xl font-black leading-tight text-[var(--heading)]">{article.title}</h3>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--ink-soft)]">{article.excerpt}</p>
                <p className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[var(--accent)]">
                  Lire
                  <ArrowRight className="h-4 w-4" />
                </p>
              </Link>
            ))}
          </div>

          <div className="mt-10 rounded-lg border border-[var(--line)] bg-[var(--accent-dark)] p-6 text-[var(--juris-on-primary)] sm:p-8">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div>
                <div className="flex items-center gap-2 text-white/80">
                  <LockKeyhole className="h-5 w-5" />
                  <p className="text-xs font-black uppercase tracking-[0.16em]">Production readiness</p>
                </div>
                <h2 className="mt-3 text-3xl font-black text-white">Le socle produit est en train de passer de prototype a SaaS facturable.</h2>
                <p className="mt-3 max-w-3xl text-base leading-7 text-white/80">
                  Auth, isolation entreprise, exports serveur, paie 2026 et persistence sont maintenant les priorites visibles du produit.
                </p>
              </div>
              <Link
                href="/contact"
                className="inline-flex h-12 items-center justify-center rounded-lg bg-white px-5 text-sm font-black text-[var(--accent-dark)]"
              >
                Contacter SIMPAIE
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
