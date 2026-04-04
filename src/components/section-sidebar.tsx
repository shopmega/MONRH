"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { X } from "lucide-react";
import type { LocalizedText } from "@/lib/navigation/category-hubs";

type SidebarItem = {
  title: LocalizedText;
  href: string;
};

type SidebarGroup = {
  title: LocalizedText;
  items: SidebarItem[];
};

type SectionSidebarProps = {
  title: LocalizedText;
  items?: SidebarItem[];
  groups?: SidebarGroup[];
  backHref?: string;
  backLabel?: LocalizedText;
  onClose?: () => void;
  className?: string;
};

export function SectionSidebar({
  title,
  items,
  groups,
  backHref,
  backLabel,
  onClose,
  className = "",
}: SectionSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === pathname) return true;
    // Handle /simulateurs -> /simulate rewrites
    const normalizedPathname = pathname.replace(/^\/simulateurs\//, "/simulate/");
    const normalizedHref = href.replace(/^\/simulateurs\//, "/simulate/");
    return normalizedHref === normalizedPathname;
  };

  const renderItems = (itemList: SidebarItem[]) => (
    <ul className="space-y-1">
      {itemList.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            onClick={onClose}
            className={`group relative flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
              isActive(item.href)
                ? "bg-gradient-to-r from-[var(--accent-soft)] to-[var(--accent-soft)/50] text-[var(--accent-strong)] shadow-sm border border-[var(--accent-soft)/50]"
                : "text-[var(--foreground)] hover:bg-[var(--surface-strong)] hover:translate-x-1"
            }`}
          >
            <span className="flex-1">{item.title.fr}</span>
            {isActive(item.href) && (
              <svg className="h-3 w-3 text-[var(--accent)]" fill="currentColor" viewBox="0 0 8 8">
                <circle cx="4" cy="4" r="3" />
              </svg>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <div className={`h-full overflow-y-auto ${className}`}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-b from-[var(--surface-strong)] to-[var(--surface-strong)]/95 backdrop-blur-sm border-b border-[var(--line)] p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--heading)] flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[var(--accent)]"></div>
            {title.fr}
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-[var(--ink-soft)] hover:bg-[var(--surface-strong)] hover:text-[var(--foreground)] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="p-4 space-y-6">
        {/* Back link */}
        {backHref && backLabel && (
          <div className="mb-4">
            <Link
              href={backHref}
              onClick={onClose}
              className="group flex items-center gap-2 text-sm text-[var(--ink-soft)] hover:text-[var(--foreground)] transition-colors"
            >
              <svg className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              {backLabel.fr}
            </Link>
          </div>
        )}

        {/* Groups or flat items */}
        {groups ? (
          <div className="space-y-6">
            {groups.map((group, index) => (
              <div key={index} className="space-y-3">
                <h3 className="section-kicker text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)] flex items-center gap-2">
                  <div className="h-px flex-1 bg-[var(--line)]"></div>
                  <span>{group.title.fr}</span>
                  <div className="h-px flex-1 bg-[var(--line)]"></div>
                </h3>
                {renderItems(group.items)}
              </div>
            ))}
          </div>
        ) : (
          items && renderItems(items)
        )}
      </div>
    </div>
  );
}
