"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { usePublicConfig } from "@/components/public-config-provider";
import { useTheme } from "@/components/theme-provider";
import { CATEGORY_HUBS } from "@/lib/navigation/category-hubs";
import { AccountDropdown } from "./account-dropdown";
import { SITE_NAME } from "@/lib/seo";

type NavKey = "home" | "salary" | "departure" | "leaveCnss" | "disputes" | "models" | "account" | "jobScanner";

type NavItem = {
  key: NavKey;
  href: string;
};

type MegaMenuSection = {
  labelKey: NavKey;
  href: string;
  hubKey: keyof typeof CATEGORY_HUBS;
};

const NAV_ITEMS: NavItem[] = [
  { key: "home", href: "/" },
  { key: "salary", href: "/salaire" },
  { key: "departure", href: "/contrat-depart" },
  { key: "leaveCnss", href: "/conges-cnss" },
  { key: "disputes", href: "/litiges" },
  { key: "models", href: "/modeles" },
  { key: "jobScanner", href: "https://avisine.com/job-offers" },
  { key: "account", href: "/compte" },
];

const DESKTOP_MENU_SECTIONS: MegaMenuSection[] = [
  { labelKey: "salary", href: "/salaire", hubKey: "salaire" },
  { labelKey: "departure", href: "/contrat-depart", hubKey: "contrat-depart" },
  { labelKey: "leaveCnss", href: "/conges-cnss", hubKey: "conges-cnss" },
  { labelKey: "disputes", href: "/litiges", hubKey: "litiges" },
  { labelKey: "models", href: "/modeles", hubKey: "modeles" },
];

const ARABIC_NAV_LABELS: Record<NavKey, string> = {
  home: "الرئيسية",
  salary: "الأجر",
  departure: "العقد والمغادرة",
  leaveCnss: "العطل و CNSS",
  disputes: "النزاعات",
  models: "النماذج",
  account: "الحساب",
  jobScanner: "ماسح الوظائف",
};

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}


export function SiteNav() {
  const pathname = usePathname();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { config } = usePublicConfig();
  const websiteSettings = config.websiteSettings;
  const [adminVisible, setAdminVisible] = useState(false);
  const [openMenu, setOpenMenu] = useState<NavKey | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!drawerOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDrawerOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [drawerOpen]);

  const refreshAdminVisibility = useCallback(() => {
    fetch("/api/admin/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { ok?: boolean; authenticated?: boolean }) => {
        setAdminVisible(Boolean(data.ok && data.authenticated));
      })
      .catch(() => {
        setAdminVisible(false);
      });
  }, []);

  useEffect(() => {
    refreshAdminVisibility();
    const onFocus = () => refreshAdminVisibility();
    const onAuthChanged = () => refreshAdminVisibility();
    window.addEventListener("focus", onFocus);
    window.addEventListener("salarie-auth-changed", onAuthChanged);

    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("salarie-auth-changed", onAuthChanged);
    };
  }, [refreshAdminVisibility]);

  const navItems = NAV_ITEMS;
  const navLabel = (key: NavKey) => (language === "ar" ? ARABIC_NAV_LABELS[key] : t(`nav.${key}`));

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[var(--line)]/90 bg-[var(--header-bg)] backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:px-6">
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link href="/" className="flex items-center gap-2.5 group">
              {websiteSettings.logoUrl ? (
                <Image
                  src={websiteSettings.logoUrl}
                  alt={websiteSettings.siteName || "Logo"}
                  width={36}
                  height={36}
                  className="h-9 w-9 rounded-xl border border-[var(--line)] object-cover"
                  unoptimized
                />
              ) : (
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--accent)] text-sm font-black text-white">
                  S
                </div>
              )}
              <p className="display-font text-lg font-semibold tracking-tight text-[var(--foreground)] hidden sm:block">
                {websiteSettings.siteName.trim() || SITE_NAME}
              </p>
            </Link>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 print:hidden">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--foreground)] transition hover:bg-[var(--surface-strong)] md:hidden"
              aria-label={t("nav.openMenu") ?? "Open menu"}
              aria-expanded={drawerOpen}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 7h18M3 12h18M3 17h18" />
              </svg>
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="grid h-9 w-9 place-items-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--foreground)] transition hover:bg-[var(--surface-strong)]"
              aria-label={theme === "dark" ? t("nav.enableLight") : t("nav.enableDark")}
              title={theme === "dark" ? t("nav.enableLight") : t("nav.enableDark")}
            >
              {theme === "dark" ? (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="12" r="4.2" />
                  <path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M18.7 5.3l-1.8 1.8M7.1 16.9l-1.8 1.8" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M20 14.5A8.5 8.5 0 1 1 11 4a7.5 7.5 0 0 0 9 10.5Z" />
                </svg>
              )}
            </button>

            <div className="flex items-center rounded-full border border-[var(--line)] bg-[var(--surface)] p-1">
              <button
                type="button"
                onClick={() => setLanguage("fr")}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold sm:px-3 ${
                  language === "fr"
                    ? "bg-[var(--accent)] text-white"
                    : "text-[var(--ink-soft)] hover:bg-[var(--surface-strong)]"
                }`}
                aria-label={t("nav.switchToFrench")}
              >
                FR
              </button>
              <button
                type="button"
                onClick={() => setLanguage("ar")}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold sm:px-3 ${
                  language === "ar"
                    ? "bg-[var(--accent)] text-white"
                    : "text-[var(--ink-soft)] hover:bg-[var(--surface-strong)]"
                }`}
                aria-label={t("nav.switchToArabic")}
              >
                AR
              </button>
            </div>

            <nav
              className="hidden items-center rounded-full border border-[var(--line)] bg-[var(--surface)] p-1 md:flex"
              onMouseLeave={() => setOpenMenu(null)}
            >
              <Link
                href="/"
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive(pathname, "/")
                    ? "bg-[var(--accent)] text-white"
                    : "text-[var(--ink-soft)] hover:bg-[var(--surface-strong)]"
                }`}
              >
                {navLabel("home")}
              </Link>
              {DESKTOP_MENU_SECTIONS.map((section) => {
                const active = isActive(pathname, section.href);
                const hub = CATEGORY_HUBS[section.hubKey];
                const copy = language === "ar" ? "ar" : "fr";
                const visibleLinks = hub.links.slice(0, 6);

                return (
                  <div
                    key={section.labelKey}
                    className="relative"
                    onMouseEnter={() => setOpenMenu(section.labelKey)}
                    onFocus={() => setOpenMenu(section.labelKey)}
                  >
                    <Link
                      href={section.href}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        active || openMenu === section.labelKey
                          ? "bg-[var(--accent)] text-white"
                          : "text-[var(--ink-soft)] hover:bg-[var(--surface-strong)]"
                      }`}
                    >
                      {navLabel(section.labelKey)}
                    </Link>
                    {openMenu === section.labelKey ? (
                      <div className="absolute left-1/2 top-[calc(100%+0.6rem)] z-50 w-[40rem] -translate-x-1/2">
                        <div className="grid gap-4 rounded-[1.75rem] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-2xl lg:grid-cols-[1.1fr_1.7fr]">
                          <Link
                            href={hub.featuredHref}
                            className="soft-card rounded-[1.4rem] p-5 transition hover:-translate-y-0.5"
                          >
                            <p className="section-kicker">{hub.kicker[copy]}</p>
                            <h3 className="display-font mt-2 text-2xl font-semibold leading-tight text-[var(--foreground)]">
                              {hub.featuredLabel[copy]}
                            </h3>
                            <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">
                              {hub.featuredDescription[copy]}
                            </p>
                            <span className="mt-4 inline-flex text-sm font-semibold text-[var(--accent)]">
                              {copy === "ar" ? "افتح الآن" : "Ouvrir"}
                            </span>
                          </Link>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {visibleLinks.map((link) => (
                              <Link
                                key={link.href}
                                href={link.href}
                                className="rounded-2xl border border-[var(--line)] bg-[var(--surface-muted)] p-4 transition hover:border-[var(--accent-soft)] hover:bg-[var(--surface-strong)]"
                              >
                                <h4 className="text-sm font-semibold text-[var(--foreground)]">{link.title[copy]}</h4>
                                <p className="mt-1 text-xs leading-relaxed text-[var(--ink-soft)]">
                                  {link.description[copy]}
                                </p>
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </nav>

            <Link
              href="https://avisine.com/job-offers"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest border border-primary/20 hover:bg-primary hover:text-white transition-all whitespace-nowrap"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
              </span>
              {t('nav.jobScanner')}
            </Link>

            <AccountDropdown adminVisible={adminVisible} />
          </div>
        </div>
      </header>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            aria-hidden="true"
            onClick={() => setDrawerOpen(false)}
          />
          <aside
            className="relative flex h-full w-[min(90vw,18rem)] flex-col gap-4 overflow-y-auto border-r border-[var(--line)] bg-[var(--surface)] p-4 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label={t("nav.mobileMenu") ?? "Mobile menu"}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[var(--foreground)]">{t("nav.menu") ?? "Menu"}</span>
              <button
                type="button"
                className="grid h-8 w-8 place-items-center rounded-md border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-strong)]"
                onClick={() => setDrawerOpen(false)}
                aria-label={t("nav.closeMenu") ?? "Close menu"}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            <nav aria-label={t("nav.mobileMenu") ?? "Mobile menu"}>
              <ul className="space-y-1">
                {navItems.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <li key={item.key}>
                      <Link
                        href={item.href}
                        onClick={() => setDrawerOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={`block rounded-xl px-3 py-2 text-sm font-semibold ${
                          active
                            ? "bg-[var(--accent)] text-white"
                            : "text-[var(--foreground)] hover:bg-[var(--surface-strong)]"
                        }`}
                      >
                        {navLabel(item.key)}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>
        </div>
      ) : null}

    </>
  );
}
