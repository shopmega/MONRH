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
            className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive(item.href)
                ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                : "text-[var(--foreground)] hover:bg-[var(--surface-strong)]"
            }`}
          >
            {item.title.fr}
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <div className={`h-full overflow-y-auto ${className}`}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--surface-strong)] border-b border-[var(--line)] p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--heading)]">
            {title.fr}
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-[var(--ink-soft)] hover:bg-[var(--surface-strong)] hover:text-[var(--foreground)]"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="p-4">
        {/* Back link */}
        {backHref && backLabel && (
          <div className="mb-4">
            <Link
              href={backHref}
              onClick={onClose}
              className="flex items-center gap-2 text-sm text-[var(--ink-soft)] hover:text-[var(--foreground)]"
            >
              ← {backLabel.fr}
            </Link>
          </div>
        )}

        {/* Groups or flat items */}
        {groups ? (
          <div className="space-y-6">
            {groups.map((group, index) => (
              <div key={index}>
                <h3 className="section-kicker mb-2 text-xs font-semibold uppercase tracking-wide">
                  {group.title.fr}
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
