"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import {
  fetchEmployerCompaniesFromCloud,
  readActiveEmployerCompanyId,
  readEmployerCompanies,
  writeActiveEmployerCompanyId,
  writeEmployerCompanies,
} from "@/lib/employer/company-store";
import {
  fetchEmployerEmployeesFromCloud,
  writeEmployerEmployees,
} from "@/lib/employer/employee-store";
import {
  fetchEmployerPayrollRunsFromCloud,
  writeEmployerPayrollRuns,
} from "@/lib/employer/payroll-store";
import {
  fetchEmployerLeaveRequestsFromCloud,
  writeEmployerLeaveRequests,
} from "@/lib/employer/leave-store";
import {
  fetchEmployerTimeEntriesFromCloud,
  writeEmployerTimeEntries,
} from "@/lib/employer/time-store";
import {
  fetchEmployerCnssExportsFromCloud,
  writeEmployerCnssExports,
} from "@/lib/employer/cnss-store";
import {
  fetchEmployerContractRecordsFromCloud,
  writeEmployerContractRecords,
} from "@/lib/employer/contract-record-store";
import {
  fetchEmployerPayrollSettingsFromCloud,
  writeEmployerPayrollSettings,
} from "@/lib/employer/payroll-settings-store";

async function hydrateList<T>(
  companyId: string,
  fetchCloud: (companyId: string) => Promise<T[] | null>,
  writeLocal: (items: T[]) => void,
) {
  const cloudItems = await fetchCloud(companyId);
  if (cloudItems === null) return;
  writeLocal(cloudItems);
}

export function EmployerDataBootstrapClient({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [hasCompany, setHasCompany] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      let nextHasCompany = false;
      try {
        let companies = readEmployerCompanies();
        const cloudCompanies = await fetchEmployerCompaniesFromCloud();
        if (cloudCompanies !== null) {
          companies = cloudCompanies;
          writeEmployerCompanies(cloudCompanies);
        }

        const activeCompanyId = readActiveEmployerCompanyId(companies);
        if (activeCompanyId) writeActiveEmployerCompanyId(activeCompanyId);
        const activeCompany = companies.find((company) => company.id === activeCompanyId) ?? companies[0] ?? null;
        nextHasCompany = Boolean(activeCompany);
        if (!activeCompany) return;

        await Promise.allSettled([
          hydrateList(
            activeCompany.id,
            fetchEmployerEmployeesFromCloud,
            writeEmployerEmployees,
          ),
          hydrateList(
            activeCompany.id,
            fetchEmployerPayrollRunsFromCloud,
            writeEmployerPayrollRuns,
          ),
          hydrateList(
            activeCompany.id,
            fetchEmployerLeaveRequestsFromCloud,
            writeEmployerLeaveRequests,
          ),
          hydrateList(
            activeCompany.id,
            fetchEmployerTimeEntriesFromCloud,
            writeEmployerTimeEntries,
          ),
          hydrateList(
            activeCompany.id,
            fetchEmployerCnssExportsFromCloud,
            writeEmployerCnssExports,
          ),
          hydrateList(
            activeCompany.id,
            fetchEmployerContractRecordsFromCloud,
            writeEmployerContractRecords,
          ),
          fetchEmployerPayrollSettingsFromCloud(activeCompany.id).then((settings) => {
            if (settings) writeEmployerPayrollSettings(settings);
          }),
        ]);
      } finally {
        if (!cancelled) {
          setHasCompany(nextHasCompany);
          setReady(true);
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-6">
        <div className="h-3 w-28 rounded-full bg-[var(--surface-muted)]" />
        <div className="mt-4 h-8 w-64 max-w-full rounded-lg bg-[var(--surface-muted)]" />
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="h-24 rounded-lg bg-[var(--surface-muted)]" />
          <div className="h-24 rounded-lg bg-[var(--surface-muted)]" />
          <div className="h-24 rounded-lg bg-[var(--surface-muted)]" />
        </div>
      </div>
    );
  }

  const settingsRoute = pathname === "/employer/settings" || pathname.startsWith("/employer/settings/");
  if (!hasCompany && !settingsRoute) {
    return (
      <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-6">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">Entreprise requise</p>
        <h1 className="mt-2 text-2xl font-black text-[var(--heading)]">Configurez une entreprise employeur</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--ink-soft)]">
          Le compte ne contient encore aucune entreprise. Les modules RH et paie restent fermes tant que le contexte
          employeur n'est pas cree.
        </p>
        <Link
          href="/employer/settings"
          className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-[var(--accent)] px-4 text-sm font-bold text-[var(--juris-on-primary)]"
        >
          Ouvrir les parametres
        </Link>
      </section>
    );
  }

  return <>{children}</>;
}
