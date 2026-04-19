"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { useTheme } from "@/components/theme-provider";
import { SITE_NAME } from "@/lib/seo";

type NavKey = "home" | "salaire" | "carriere" | "depart" | "bibliotheque" | "modeles" | "account";

type NavItem = {
  key: NavKey;
  href: string;
};

const NAV_ITEMS: NavItem[] = [
  { key: "home", href: "/" },
  { key: "salaire", href: "/situation/mon-salaire" },
  { key: "carriere", href: "/situation/ma-carriere" },
  { key: "depart", href: "/situation/depart-rupture" },
  { key: "bibliotheque", href: "/bibliotheque" },
  { key: "modeles", href: "/modeles" },
  { key: "account", href: "/compte" },
];

const ARABIC_NAV_LABELS: Record<NavKey, string> = {
  home: "الرئيسية",
  salaire: "الأجر",
  carriere: "المسار المهني",
  depart: "المغادرة",
  bibliotheque: "مكتبة",
  modeles: "نماذج",
  account: "الحساب",
};

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function SiteNav() {
  const { language } = useLanguage();
  const [openMenu, setOpenMenu] = useState(false);
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const toggleMenu = useCallback(() => {
    setOpenMenu(!openMenu);
  }, [openMenu]);

  const closeMenu = useCallback(() => {
    setOpenMenu(false);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeMenu();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [closeMenu]);

  return (
    <>
      <div className="sticky top-0 z-50 w-full border-b border-[var(--line)] bg-[var(--background)]">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <Image
                src="/placeholder-logo.png"
                alt={SITE_NAME}
                width={32}
                height={32}
                className="rounded-lg"
              />
              <span className="text-xl font-bold text-[var(--ink)]">{SITE_NAME}</span>
            </Link>

            <DesktopNav />

            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-[var(--highlight)] transition-colors"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 3v1c0 4.3-2.6 7.8-7.9V7l7-4Z" />
                    <path d="M12 3v1c0 4.3-2.6 7.8-7.9V7l7-4Z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 3v1c0 4.3-2.6 7.8-7.9V7l7-4Z" />
                  </svg>
                )}
              </button>

              <button
                onClick={toggleMenu}
                className="p-2 rounded-lg hover:bg-[var(--highlight)] transition-colors lg:hidden"
                aria-label="Toggle menu"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="9" y1="6" x2="15" y2="18" />
                  <line x1="9" y1="18" x2="15" y2="6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className={`fixed inset-x-0 bottom-0 z-50 w-full bg-[var(--background)] border-t border-[var(--line)] lg:hidden transition-transform duration-300 ${openMenu ? "translate-y-0" : "translate-y-full"}`}>
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex justify-around py-2">
            {NAV_ITEMS.slice(0, 5).map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                  isActive(pathname, item.href)
                    ? "bg-[var(--accent)] text-white"
                    : "text-[var(--ink)] hover:bg-[var(--highlight)]"
                }`}
              >
                <span className="text-xs font-medium">{ARABIC_NAV_LABELS[item.key]}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function DesktopNav() {
  const { language } = useLanguage();
  const pathname = usePathname();

  const navLabels = language === "ar" ? ARABIC_NAV_LABELS : {
    home: "Accueil",
    salaire: "Mon Salaire",
    carriere: "Ma Carrière",
    depart: "Départ",
    bibliotheque: "Bibliothèque",
    modeles: "Modèles",
    account: "Mon Compte",
  };

  return (
    <nav className="hidden lg:flex space-x-8">
      {NAV_ITEMS.slice(0, 5).map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={`text-sm font-medium text-[var(--ink)] hover:text-[var(--accent)] transition-colors ${
            isActive(pathname, item.href) ? "text-[var(--accent)]" : ""
          }`}
        >
          {navLabels[item.key]}
        </Link>
      ))}
      
      <div className="relative group">
        <button
          className="flex items-center space-x-1 text-sm font-medium text-[var(--ink)] hover:text-[var(--accent)] transition-colors"
          aria-expanded="false"
          aria-haspopup="true"
        >
          {language === "ar" ? "قائمة" : "Menu"}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M19 9l-7 7m0 0l-7-7" />
            <polyline points="12 22 17 22" />
          </svg>
        </button>
        
        <div className="absolute right-0 top-full mt-2 w-screen max-w-4xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
          <div className="soft-card rounded-lg shadow-xl p-6 w-full max-w-4xl">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <h3 className="font-semibold text-lg mb-4">{navLabels.salaire}</h3>
                <div className="space-y-2">
                  <Link href="/simulateurs/brut-net" className="block p-3 rounded hover:bg-[var(--highlight)] transition-colors">
                    Calcul Brut → Net
                  </Link>
                  <Link href="/simulateurs/ir-annuel" className="block p-3 rounded hover:bg-[var(--highlight)] transition-colors">
                    IR / IGR
                  </Link>
                  <Link href="/simulateurs/conformite-smig" className="block p-3 rounded hover:bg-[var(--highlight)] transition-colors">
                    SMIG / SMAG
                  </Link>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-lg mb-4">{navLabels.carriere}</h3>
                <div className="space-y-2">
                  <Link href="/carriere/comparaison-scenarios" className="block p-3 rounded hover:bg-[var(--highlight)] transition-colors">
                    Comparaison Scenarios
                  </Link>
                  <Link href="/carriere/augmentation-salaire" className="block p-3 rounded hover:bg-[var(--highlight)] transition-colors">
                    Augmentation Salaire
                  </Link>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-lg mb-4">{navLabels.depart}</h3>
                <div className="space-y-2">
                  <Link href="/simulateurs/licenciement" className="block p-3 rounded hover:bg-[var(--highlight)] transition-colors">
                    Licenciement
                  </Link>
                  <Link href="/simulateurs/demission" className="block p-3 rounded hover:bg-[var(--highlight)] transition-colors">
                    Demission
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
