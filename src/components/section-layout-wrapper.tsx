"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { SectionSidebar } from "./section-sidebar";
import type { LocalizedText } from "@/lib/navigation/category-hubs";

type SidebarItem = {
  title: LocalizedText;
  href: string;
};

type SidebarGroup = {
  title: LocalizedText;
  items: SidebarItem[];
};

type SectionLayoutWrapperProps = {
  children: React.ReactNode;
  indexPath: string;
  sidebarProps: {
    title: LocalizedText;
    items?: SidebarItem[];
    groups?: SidebarGroup[];
    backHref?: string;
    backLabel?: LocalizedText;
  };
};

export function SectionLayoutWrapper({
  children,
  indexPath,
  sidebarProps,
}: SectionLayoutWrapperProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  function normalizeSectionPath(path: string) {
    return path
      .replace(/^\/simulateurs(?=\/|$)/, "/simulate")
      .replace(/^\/outils(?=\/|$)/, "/tools");
  }

  const normalizedIndexPath = normalizeSectionPath(indexPath);
  const normalizedPathname = normalizeSectionPath(pathname);
  const isIndexPageNormalized = normalizedPathname === normalizedIndexPath || normalizedPathname === normalizedIndexPath + "/";

  const shouldShowSidebar = !isIndexPageNormalized;

  return (
    <div className="relative">
      {/* Mobile menu toggle bar */}
      {shouldShowSidebar && (
        <div className="lg:hidden sticky top-0 z-20 bg-gradient-to-r from-[var(--surface-strong)] to-[var(--surface-strong)]/95 backdrop-blur-md border-b border-[var(--line)] px-4 py-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--heading)] flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[var(--accent)]"></div>
              {sidebarProps.title.fr}
            </h2>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="rounded-lg p-2 text-[var(--ink-soft)] hover:bg-[var(--surface-strong)] hover:text-[var(--foreground)] transition-all duration-200 hover:scale-105"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile sidebar overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Mobile sidebar */}
          <div className="relative w-80 max-w-[80vw] bg-gradient-to-b from-[var(--surface-strong)] to-[var(--surface)] shadow-2xl">
            <SectionSidebar
              {...sidebarProps}
              onClose={() => setIsMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Desktop layout */}
      <div className="flex gap-6">
        {/* Desktop sidebar */}
        {shouldShowSidebar && (
          <aside className="hidden lg:block lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-60 lg:flex-shrink-0">
            <div className="soft-card rounded-xl h-full overflow-hidden shadow-lg border border-[var(--line)]/50">
              <SectionSidebar {...sidebarProps} />
            </div>
          </aside>
        )}

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
