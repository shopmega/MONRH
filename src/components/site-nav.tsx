"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { usePublicConfig } from "@/components/public-config-provider";
import { useTheme } from "@/components/theme-provider";
import { SITE_NAME } from "@/lib/seo";

type NavKey = "home" | "simulate" | "documents" | "library" | "account" | "admin";

type NavItem = {
  key: NavKey;
  href: string;
};

const NAV_ITEMS: NavItem[] = [
  { key: "home", href: "/" },
  { key: "simulate", href: "/simulateurs" },
  { key: "documents", href: "/documents" },
  { key: "library", href: "/bibliotheque" },
  { key: "account", href: "/compte" },
];

const ADMIN_NAV_ITEM: NavItem = { key: "admin", href: "/admin" };

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
  if (itemKey === "simulate") {
    return (
      <svg viewBox="0 0 24 24" className={baseClass} fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="4" y="3" width="16" height="18" rx="2.5" />
        <path d="M8 8h8M8 12h3M13 12h3M8 16h8" />
      </svg>
    );
  }
  if (itemKey === "documents") {
    return (
      <svg viewBox="0 0 24 24" className={baseClass} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M7 3h7l4 4v14H7z" />
        <path d="M14 3v5h5M9 12h6M9 16h6" />
      </svg>
    );
  }
  if (itemKey === "library") {
    return (
      <svg viewBox="0 0 24 24" className={baseClass} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 5h7v14H4zM13 5h7v14h-7z" />
        <path d="M11 7h2M11 11h2M11 15h2" />
      </svg>
    );
  }
  if (itemKey === "admin") {
    return (
      <svg viewBox="0 0 24 24" className={baseClass} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3l7 4v5c0 4.3-2.6 7.8-7 9-4.4-1.2-7-4.7-7-9V7l7-4Z" />
        <path d="M9.5 12.5 11 14l3.5-3.5" />
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

  const navItems = useMemo(
    () => (adminVisible ? [...NAV_ITEMS, ADMIN_NAV_ITEM] : NAV_ITEMS),
    [adminVisible],
  );

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

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
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

            <nav className="hidden items-center rounded-full border border-[var(--line)] bg-[var(--surface)] p-1 md:flex">
              {navItems.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      active
                        ? "bg-[var(--accent)] text-white"
                        : "text-[var(--ink-soft)] hover:bg-[var(--surface-strong)]"
                    }`}
                  >
                    {t(`nav.${item.key}`)}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      <nav className="fixed inset-x-2 bottom-3 z-50 rounded-2xl border border-[var(--line-strong)] bg-[var(--surface)] p-1.5 shadow-xl backdrop-blur sm:inset-x-3 md:hidden">
        <ul
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}
        >
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  aria-label={t(`nav.${item.key}`)}
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
                    {t(`nav.${item.key}`)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
