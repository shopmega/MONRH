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

type NavKey = "home" | "salary" | "departure" | "leaveCnss" | "disputes" | "models" | "account";

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
};

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

function MobileIcon({ itemKey }: { itemKey: NavKey }) {
  const baseClass = "h-4 w-4";
  if (itemKey === "home") {
    return (
      <svg viewBox="0 0 24 24" className={baseClass} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 10.5L12 3l9 7.5" />
        <path d="M5 9.8V21h14V9.8" />
      </svg>
    );
  }
  if (itemKey === "salary") {
    return (
      <svg viewBox="0 0 24 24" className={baseClass} fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="4" y="3" width="16" height="18" rx="2.5" />
        <path d="M8 8h8M8 12h3M13 12h3M8 16h8" />
      </svg>
    );
  }
  if (itemKey === "departure") {
    return (
      <svg viewBox="0 0 24 24" className={baseClass} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" x2="8" y1="13" y2="13" />
        <line x1="16" x2="8" y1="17" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    );
  }
  if (itemKey === "models") {
    return (
      <svg viewBox="0 0 24 24" className={baseClass} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M7 3h7l4 4v14H7z" />
        <path d="M14 3v5h5M9 12h6M9 16h6" />
      </svg>
    );
  }
  if (itemKey === "leaveCnss") {
    return (
      <svg viewBox="0 0 24 24" className={baseClass} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  if (itemKey === "disputes") {
    return (
      <svg viewBox="0 0 24 24" className={baseClass} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3 4 7v5c0 4.4 3.1 8.5 8 9 4.9-.5 8-4.6 8-9V7l-8-4Z" />
        <path d="m9.5 12 1.7 1.7 3.3-3.4" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={baseClass} fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c1.2-3.3 3.8-5 7-5s5.8 1.7 7 5" />
    </svg>
  );
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
          <Link href="/" className="group min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-3">
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
              <div className="min-w-0">
                <p className="display-font truncate text-lg font-semibold tracking-tight text-[var(--foreground)]">
                  {websiteSettings.siteName.trim() || SITE_NAME}
                </p>
                <p className="hidden text-[11px] uppercase tracking-[0.15em] text-[var(--ink-soft)] sm:block">
                  {websiteSettings.siteSubtitle.trim() || t("nav.subtitle")}
                </p>
              </div>
            </div>
          </Link>

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

      <nav
        className={`fixed inset-x-2 bottom-3 z-50 rounded-2xl border border-[var(--line-strong)] bg-[var(--surface)] p-1.5 shadow-xl backdrop-blur sm:inset-x-3 md:hidden print:hidden ${drawerOpen ? "invisible pointer-events-none" : ""}`}
        role="navigation"
        aria-label="Mobile navigation"
        style={{ paddingBottom: "calc(0.375rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <ul
          className="grid gap-1"
          role="menubar"
          style={{ gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }}
        >
          {navItems.filter((item) => item.key !== "home" && item.key !== "models" && item.key !== "account").map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.key} role="none">
                <Link
                  href={item.href}
                  aria-label={navLabel(item.key)}
                  aria-current={active ? "page" : undefined}
                  role="menuitem"
                  className={`mobile-nav-link block min-w-0 rounded-xl px-1.5 py-2 text-center sm:px-2 ${
                    active
                      ? "bg-[var(--accent)] text-white"
                      : "text-[var(--ink-soft)] hover:bg-[var(--surface-strong)]"
                  }`}
                >
                  <span className="mx-auto mb-0.5 block w-fit">
                    <MobileIcon itemKey={item.key} />
                  </span>
                  <span className="mobile-nav-label block truncate text-[10px] font-semibold leading-tight sm:text-xs">
                    {navLabel(item.key)}
                  </span>
                </Link>
              </li>
            );
          })}
          <li role="none">
            <Link
              href="/compte"
              aria-label={navLabel("account")}
              aria-current={isActive(pathname, "/compte") || isActive(pathname, "/admin") ? "page" : undefined}
              role="menuitem"
              className={`mobile-nav-link block min-w-0 rounded-xl px-1.5 py-2 text-center sm:px-2 ${
                isActive(pathname, "/compte") || isActive(pathname, "/admin")
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--ink-soft)] hover:bg-[var(--surface-strong)]"
              }`}
            >
              <span className="mx-auto mb-0.5 block w-fit">
                <MobileIcon itemKey="account" />
              </span>
              <span className="mobile-nav-label block truncate text-[10px] font-semibold leading-tight sm:text-xs">
                {navLabel("account")}
              </span>
            </Link>
          </li>
        </ul>
      </nav>
    </>
  );
}
