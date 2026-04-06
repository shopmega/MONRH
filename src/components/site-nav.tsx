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

type NavKey = "home" | "simulate" | "plan" | "tools" | "documents" | "contracts" | "library" | "account" | "admin";

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
  { key: "simulate", href: "/simulateurs" },
  { key: "plan", href: "/planifier" },
  { key: "tools", href: "/outils" },
  { key: "documents", href: "/documents" },
  { key: "contracts", href: "/contrat" },
  { key: "library", href: "/bibliotheque" },
  { key: "account", href: "/compte" },
];

const MobileIcon = ({ itemKey, baseClass }: { itemKey: NavKey; baseClass: string }) => {
  if (itemKey === "home") {
    return (
      <svg viewBox="0 0 24 24" className={baseClass} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 9.5L12 3l9 6.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9.5z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    );
  }
  if (itemKey === "simulate") {
    return (
      <svg viewBox="0 0 24 24" className={baseClass} fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    );
  }
  if (itemKey === "plan") {
    return (
      <svg viewBox="0 0 24 24" className={baseClass} fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    );
  }
  if (itemKey === "library") {
    return (
      <svg viewBox="0 0 24 24" className={baseClass} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    );
  }
  if (itemKey === "tools") {
    return (
      <svg viewBox="0 0 24 24" className={baseClass} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3l7 4v5c0 4.3-2.6 7.8-7 9-4.4-1.2-7-4.7-7-9V7l7-4Z" />
        <path d="M9 12h6M12 9v6" />
      </svg>
    );
  }
  if (itemKey === "admin") {
    return (
      <svg viewBox="0 0 24 24" className={baseClass} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    );
  }
  if (itemKey === "documents") {
    return (
      <svg viewBox="0 0 24 24" className={baseClass} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    );
  }
  if (itemKey === "contracts") {
    return (
      <svg viewBox="0 0 24 24" className={baseClass} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="12" y1="18" x2="12" y2="12" />
        <line x1="9" y1="15" x2="15" y2="15" />
      </svg>
    );
  }
  // Default account fallback
  return (
    <svg viewBox="0 0 24 24" className={baseClass} fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c1.2-3.3 3.8-5 7-5s5.8 1.7 7 5" />
    </svg>
  );
};

const DESKTOP_MENU_SECTIONS: MegaMenuSection[] = [
  { labelKey: "simulate", href: "/simulateurs", hubKey: "salaire" },
  { labelKey: "plan", href: "/planifier", hubKey: "carriere" },
  { labelKey: "tools", href: "/outils", hubKey: "litiges" },
  { labelKey: "documents", href: "/documents", hubKey: "modeles" },
];

const ARABIC_NAV_LABELS: Record<NavKey, string> = {
  home: "الرئيسية",
  simulate: "محاكاة",
  plan: "تخطيط",
  tools: "أدوات",
  documents: "وثائق",
  contracts: "عقود",
  library: "مكتبة",
  account: "الحساب",
  admin: "الإدارة",
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
              <Link
                href="/contrat"
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive(pathname, "/contrat")
                    ? "bg-[var(--accent)] text-white"
                    : "text-[var(--ink-soft)] hover:bg-[var(--surface-strong)]"
                }`}
              >
                {navLabel("contracts")}
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
                        className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all ${
                          active
                            ? "bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/20"
                            : "text-[var(--foreground)] hover:bg-[var(--surface-strong)]"
                        }`}
                      >
                        <MobileIcon itemKey={item.key} baseClass="h-5 w-5" />
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

      {/* Bottom Navigation for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--line)]/50 bg-[var(--surface)]/80 p-2 backdrop-blur-xl md:hidden print:hidden">
        <div className="flex items-center justify-around">
          {NAV_ITEMS.filter(item => ["home", "simulate", "documents", "contracts", "tools"].includes(item.key)).map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 transition-all ${
                  active ? "text-[var(--accent)]" : "text-[var(--ink-soft)]"
                }`}
              >
                <div className={`rounded-lg p-1 transition-all ${active ? "bg-[var(--accent)]/10" : ""}`}>
                  <MobileIcon itemKey={item.key} baseClass="h-6 w-6" />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider">{navLabel(item.key)}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
