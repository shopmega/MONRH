"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  BadgeCheck,
  BrainCircuit,
  Building2,
  CalendarClock,
  ChartNoAxesCombined,
  ClipboardList,
  CircleDollarSign,
  FileSpreadsheet,
  FileText,
  LayoutDashboard,
  Menu,
  Settings,
  Timer,
  UserRoundCheck,
  X,
} from "lucide-react";
import { EmployerCompanySwitcher } from "@/components/employer/employer-company-switcher";

const workspaceGroups = [
  {
    label: "Vue",
    items: [{ href: "/employer", label: "Tableau de bord", icon: LayoutDashboard }],
  },
  {
    label: "RH",
    items: [
      { href: "/employer/employees", label: "Salaries", icon: ClipboardList },
      { href: "/employer/contracts", label: "Contrats", icon: BriefcaseBusiness },
      { href: "/employer/leave", label: "Conges", icon: CalendarClock },
      { href: "/employer/time", label: "Pointage", icon: Timer },
      { href: "/employer/self-service", label: "Self-service", icon: UserRoundCheck },
    ],
  },
  {
    label: "Paie",
    items: [
      { href: "/employer/payroll", label: "Paie", icon: FileText },
      { href: "/employer/cnss", label: "Declarations", icon: FileSpreadsheet },
      { href: "/employer/payroll-settings", label: "Parametres paie", icon: Settings },
      { href: "/employer/reports", label: "Etats", icon: CircleDollarSign },
    ],
  },
  {
    label: "Pilotage",
    items: [
      { href: "/employer/compliance", label: "Alertes", icon: BadgeCheck },
      { href: "/employer/assistant", label: "Assistant", icon: BrainCircuit },
      { href: "/employer/analytics", label: "Analytics", icon: ChartNoAxesCombined },
    ],
  },
  {
    label: "Admin",
    items: [
      { href: "/employer/cabinet", label: "Cabinet", icon: BriefcaseBusiness },
      { href: "/employer/settings", label: "Parametres", icon: Settings },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href.includes("#")) return false;
  if (href === "/employer") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function EmployerWorkspaceNav({ variant = "sidebar" }: { variant?: "sidebar" | "mobile" }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const activeItem = useMemo(
    () => workspaceGroups.flatMap((group) => group.items).find((item) => isActive(pathname, item.href)),
    [pathname],
  );

  if (variant === "mobile") {
    return (
      <div className="mb-5 space-y-3">
        <div className="flex items-center justify-between rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3">
          <Link href="/employer" className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] text-[var(--juris-on-primary)]">
              <Building2 className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-black uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                MONRH
              </span>
              <span className="block truncate text-sm font-black text-[var(--heading)]">
                {activeItem?.label ?? "Portail employeur"}
              </span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] text-[var(--heading)]"
            aria-expanded={open}
            aria-label={open ? "Fermer le menu employeur" : "Ouvrir le menu employeur"}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open && (
          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3 shadow-sm">
            <EmployerCompanySwitcher compact />
            <div className="mt-3 space-y-4">
              {workspaceGroups.map((group) => (
                <div key={group.label}>
                  <p className="px-2 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                    {group.label}
                  </p>
                  <div className="mt-1 grid gap-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(pathname, item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={`flex h-10 items-center gap-3 rounded-md px-3 text-sm font-bold transition ${
                            active
                              ? "bg-[var(--accent)] text-[var(--juris-on-primary)]"
                              : "text-[var(--ink-soft)] hover:bg-[var(--surface-muted)] hover:text-[var(--heading)]"
                          }`}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      <Link href="/employer" className="mb-5 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--accent)] text-[var(--juris-on-primary)]">
          <Building2 className="h-5 w-5" />
        </span>
        <span>
          <span className="block text-lg font-black leading-tight text-[var(--heading)]">MONRH</span>
          <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-[var(--ink-soft)]">
            Employeur
          </span>
        </span>
      </Link>

      <div className="mb-5">
        <EmployerCompanySwitcher />
      </div>

      <nav className="space-y-5" aria-label="Navigation employeur">
          {workspaceGroups.map((group) => (
          <div key={group.label}>
            <p className="px-2 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                {group.label}
            </p>
            <div className="mt-2 grid gap-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex h-10 items-center gap-3 rounded-md px-3 text-sm font-bold transition ${
                      active
                        ? "bg-[var(--accent)] text-[var(--juris-on-primary)]"
                        : "text-[var(--ink-soft)] hover:bg-[var(--surface-muted)] hover:text-[var(--heading)]"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}
