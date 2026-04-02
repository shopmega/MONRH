"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useLanguage } from "@/components/language-provider";

interface AccountDropdownProps {
  adminVisible: boolean;
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function AccountDropdown({ adminVisible }: AccountDropdownProps) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const accountActive = isActive(pathname, "/compte");
  const adminActive = isActive(pathname, "/admin");

  // If no admin access, just show a simple button
  if (!adminVisible) {
    return (
      <Link
        href="/compte"
        className={`hidden items-center rounded-full border px-4 py-2 text-sm font-semibold transition md:flex ${
          accountActive
            ? "border-[var(--accent)] bg-[var(--accent)] text-white"
            : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink-soft)] hover:bg-[var(--surface-strong)]"
        }`}
      >
        <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20c1.2-3.3 3.8-5 7-5s5.8 1.7 7 5" />
        </svg>
        {t("nav.account")}
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={`hidden items-center rounded-full border px-4 py-2 text-sm font-semibold transition md:flex ${
          accountActive || adminActive
            ? "border-[var(--accent)] bg-[var(--accent)] text-white"
            : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink-soft)] hover:bg-[var(--surface-strong)]"
        }`}
      >
        <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20c1.2-3.3 3.8-5 7-5s5.8 1.7 7 5" />
        </svg>
        {t("nav.account")}
        <svg viewBox="0 0 24 24" className="ml-2 h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-1 shadow-lg z-20">
            <Link
              href="/compte"
              onClick={() => setIsOpen(false)}
              className={`flex items-center rounded-md px-3 py-2 text-sm font-medium transition ${
                accountActive
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--foreground)] hover:bg-[var(--surface-strong)]"
              }`}
            >
              <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="8" r="3.5" />
                <path d="M5 20c1.2-3.3 3.8-5 7-5s5.8 1.7 7 5" />
              </svg>
              {t("nav.account")}
            </Link>
            <Link
              href="/admin"
              onClick={() => setIsOpen(false)}
              className={`flex items-center rounded-md px-3 py-2 text-sm font-medium transition ${
                adminActive
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--foreground)] hover:bg-[var(--surface-strong)]"
              }`}
            >
              <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 3l7 4v5c0 4.3-2.6 7.8-7 9-4.4-1.2-7-4.7-7-9V7l7-4Z" />
                <path d="M9.5 12.5 11 14l3.5-3.5" />
              </svg>
              {t("nav.admin")}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
