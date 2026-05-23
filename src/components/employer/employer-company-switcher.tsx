"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Settings } from "lucide-react";
import { employerPlanLabels, type EmployerCompany } from "@/lib/employer/portal-data";
import {
  readActiveEmployerCompanyId,
  readEmployerCompanies,
  writeActiveEmployerCompanyId,
} from "@/lib/employer/company-store";

export function EmployerCompanySwitcher({ compact = false }: { compact?: boolean }) {
  const [companies, setCompanies] = useState<EmployerCompany[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState("");

  useEffect(() => {
    const nextCompanies = readEmployerCompanies();
    setCompanies(nextCompanies);
    setActiveCompanyId(readActiveEmployerCompanyId(nextCompanies));

    function handleStorage(event: StorageEvent) {
      if (event.key && !event.key.startsWith("monrh_employer_")) return;
      const updatedCompanies = readEmployerCompanies();
      setCompanies(updatedCompanies);
      setActiveCompanyId(readActiveEmployerCompanyId(updatedCompanies));
    }

    function handleCompaniesChanged() {
      const updatedCompanies = readEmployerCompanies();
      setCompanies(updatedCompanies);
      setActiveCompanyId(readActiveEmployerCompanyId(updatedCompanies));
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener("monrh-employer-companies-changed", handleCompaniesChanged);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("monrh-employer-companies-changed", handleCompaniesChanged);
    };
  }, []);

  const activeCompany = useMemo(
    () => companies.find((company) => company.id === activeCompanyId) ?? companies[0] ?? null,
    [activeCompanyId, companies],
  );

  function selectCompany(companyId: string) {
    setActiveCompanyId(companyId);
    writeActiveEmployerCompanyId(companyId);
    window.location.reload();
  }

  if (!activeCompany) {
    return (
      <div
        className={`flex flex-col gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3 ${
          compact ? "" : "mb-3"
        }`}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--accent)]">
            Entreprise
          </span>
          <span className="text-sm font-bold text-[var(--ink-soft)]">Aucune entreprise configuree</span>
        </div>
        <Link
          href="/employer/settings"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-[var(--line)] px-3 text-sm font-bold text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
        >
          <Settings className="mr-2 h-4 w-4" />
          Parametres
        </Link>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3 ${
        compact ? "" : "mb-3"
      }`}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--accent)]">
          Entreprise
        </span>
        <select
          value={activeCompany.id}
          onChange={(event) => selectCompany(event.target.value)}
          className="input-shell h-10 min-w-0"
        >
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
        <span className="w-fit rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-[11px] font-bold text-[var(--accent)]">
          {employerPlanLabels[activeCompany.plan]}
        </span>
      </div>
      <Link
        href="/employer/settings"
        className="inline-flex h-10 items-center justify-center rounded-lg border border-[var(--line)] px-3 text-sm font-bold text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
      >
        <Settings className="mr-2 h-4 w-4" />
        Parametres
      </Link>
    </div>
  );
}
