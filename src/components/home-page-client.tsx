"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Calculator,
  CalendarClock,
  FileText,
  Scale,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { type Article, type Category } from "@/lib/content/home-content";

const primaryTools = [
  {
    label: "Salaire brut net",
    detail: "Estimez le net, les retenues CNSS/AMO et l'IR mensuel.",
    href: "/salaire/brut-net",
    icon: Calculator,
  },
  {
    label: "Bulletin de paie",
    detail: "Preparez une fiche de paie lisible avec detail des retenues.",
    href: "/planifier/bulletin-paie",
    icon: FileText,
  },
  {
    label: "Contrat de travail",
    detail: "Generez un CDI, CDD ou stage avec les mentions utiles.",
    href: "/contrat",
    icon: BriefcaseBusiness,
  },
  {
    label: "Conges & CNSS",
    detail: "Calculez conges acquis, arret maladie et droits CNSS.",
    href: "/conges-cnss",
    icon: CalendarClock,
  },
];

const audiences = [
  {
    title: "Salaries",
    copy: "Comprendre son salaire, ses conges, son preavis et ses droits avant une decision.",
    href: "/salaire",
    icon: Users,
  },
  {
    title: "Employeurs",
    copy: "Gerer les salaries, la paie, les bulletins, la CNSS et les etats RH depuis MONRH.",
    href: "/employer",
    icon: ShieldCheck,
  },
  {
    title: "Fiduciaires",
    copy: "Suivre plusieurs clients et consolider les operations paie et declarations.",
    href: "/employer/cabinet",
    icon: BriefcaseBusiness,
  },
];

const legalAreas = [
  "SMIG, brut/net et IR",
  "CNSS, AMO et prestations",
  "Contrats CDI, CDD, stage",
  "Conges, preavis et depart",
  "Heures supplementaires",
  "Litiges et salaire impaye",
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

function HeroPanel() {
  return (
    <div className="relative overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5 shadow-xl shadow-black/10">
      <div className="flex items-center gap-3 border-b border-[var(--line)] pb-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--accent)]">
          <Image src="/logo.svg" alt="SIMPAIE" width={26} height={26} priority />
        </span>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--accent)]">SIMPAIE</p>
          <p className="text-sm font-black text-[var(--heading)]">Repere paie & RH Maroc</p>
        </div>
      </div>

      <div className="mt-5 rounded-lg bg-[var(--surface-muted)] p-4">
        <div className="flex items-center gap-2 text-sm font-black text-[var(--heading)]">
          <Search className="h-4 w-4 text-[var(--accent)]" />
          Que voulez-vous verifier ?
        </div>
        <div className="mt-4 grid gap-2">
          {["Mon net a payer", "Mes conges acquis", "Un contrat CDD", "Une fiche de paie"].map((item) => (
            <div key={item} className="flex items-center justify-between rounded-lg bg-[var(--surface)] px-4 py-3">
              <span className="text-sm font-bold text-[var(--heading)]">{item}</span>
              <ArrowRight className="h-4 w-4 text-[var(--accent)]" />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-[var(--line)] p-4">
          <Calculator className="h-5 w-5 text-[var(--accent)]" />
          <p className="mt-3 text-2xl font-black">40+</p>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">simulateurs et outils</p>
        </div>
        <div className="rounded-lg border border-[var(--line)] p-4">
          <Scale className="h-5 w-5 text-[var(--accent)]" />
          <p className="mt-3 text-2xl font-black">Maroc</p>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">paie, travail et CNSS</p>
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
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_440px] lg:px-8 lg:py-16 xl:gap-16">
          <div className="flex min-w-0 flex-col justify-center">
            <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-[var(--accent)]">
              <BadgeCheck className="h-4 w-4" />
              Droit du travail & paie Maroc
            </div>
            <h1 className="mt-6 max-w-4xl text-4xl font-black leading-[1.03] text-[var(--heading)] sm:text-5xl lg:text-6xl">
              Calculez, comprenez et preparez vos decisions RH au Maroc.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--ink-soft)]">
              SIMPAIE rassemble des simulateurs, modeles et guides pratiques pour les salaires, contrats,
              conges, CNSS, litiges et obligations employeur.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/simulate"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-6 text-sm font-black text-[var(--juris-on-primary)] transition hover:bg-[var(--accent-dark)]"
              >
                Lancer un simulateur
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/employer"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-6 text-sm font-black text-[var(--heading)] transition hover:bg-[var(--surface-strong)]"
              >
                Espace employeur MONRH
              </Link>
            </div>
          </div>

          <HeroPanel />
        </div>
      </section>

      <section className="border-b border-[var(--line)] bg-[var(--surface)]">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Outils principaux"
            title="Les calculs et documents les plus demandes."
            description="Accedez directement aux parcours utiles sans passer par un tableau de bord."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {primaryTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link
                  key={tool.label}
                  href={tool.href}
                  className="group rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] p-5 transition hover:border-[var(--accent)] hover:bg-[var(--surface)]"
                >
                  <Icon className="h-6 w-6 text-[var(--accent)]" />
                  <h3 className="mt-4 text-lg font-black text-[var(--heading)]">{tool.label}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{tool.detail}</p>
                  <p className="mt-4 inline-flex items-center gap-2 text-sm font-black text-[var(--accent)]">
                    Ouvrir
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--line)] bg-[var(--surface-muted)]">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-6 lg:grid-cols-[420px_minmax(0,1fr)] lg:px-8">
          <SectionHeader
            eyebrow="Pour qui ?"
            title="Un point d'entree clair selon votre besoin."
            description="Salarie, dirigeant de PME ou fiduciaire: chaque parcours mene vers les outils adaptes."
          />
          <div className="grid gap-4 md:grid-cols-3">
            {audiences.map((audience) => {
              const Icon = audience.icon;
              return (
                <Link key={audience.title} href={audience.href} className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5 hover:border-[var(--accent)]">
                  <Icon className="h-6 w-6 text-[var(--accent)]" />
                  <h3 className="mt-4 text-lg font-black text-[var(--heading)]">{audience.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{audience.copy}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--line)] bg-[var(--surface)]">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Domaines couverts"
            title="Paie, contrat, conges et litiges en langage clair."
            description="Les contenus et calculateurs sont organises autour des situations RH courantes au Maroc."
          />
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {legalAreas.map((area) => (
              <div key={area} className="flex items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] p-4">
                <BadgeCheck className="h-5 w-5 shrink-0 text-[var(--accent)]" />
                <span className="font-bold text-[var(--heading)]">{area}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[var(--surface)]">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeader
              eyebrow="Guides pratiques"
              title="Lire avant d'agir."
              description="Des articles courts pour cadrer une question avant de lancer un calcul ou preparer un document."
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
                <p className="text-xs font-black uppercase tracking-[0.16em] text-white/75">Employeurs et cabinets</p>
                <h2 className="mt-3 text-3xl font-black text-white">MONRH centralise la gestion employeur.</h2>
                <p className="mt-3 max-w-3xl text-base leading-7 text-white/80">
                  Registre salaries, paie mensuelle, bulletins, CNSS, conges, pointage et etats de paie dans un espace dedie.
                </p>
              </div>
              <Link
                href="/employer"
                className="inline-flex h-12 items-center justify-center rounded-lg bg-white px-5 text-sm font-black text-[var(--accent-dark)]"
              >
                Ouvrir MONRH
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
