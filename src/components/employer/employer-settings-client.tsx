"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, CheckCircle2, Lock, Plus } from "lucide-react";
import {
  employerPlanCapabilities,
  employerPlanLabels,
  type EmployerCompany,
  type EmployerPlan,
} from "@/lib/employer/portal-data";
import {
  canAddEmployerCompany,
  fetchEmployerCompaniesFromCloud,
  readActiveEmployerCompanyId,
  readEmployerCompanies,
  saveEmployerCompanyToCloud,
  writeActiveEmployerCompanyId,
  writeEmployerCompanies,
} from "@/lib/employer/company-store";
import { EmployerWorkspaceSyncClient } from "@/components/employer/employer-workspace-sync-client";

type CompanyFormState = {
  name: string;
  ice: string;
  cnssAffiliateNumber: string;
  city: string;
};

const emptyCompanyForm: CompanyFormState = {
  name: "",
  ice: "",
  cnssAffiliateNumber: "",
  city: "",
};

const planOrder: EmployerPlan[] = ["free", "pro", "cabinet"];

function createCompany(form: CompanyFormState, plan: EmployerPlan): EmployerCompany {
  return {
    id: crypto.randomUUID(),
    name: form.name.trim(),
    ice: form.ice.trim() || "A completer",
    cnssAffiliateNumber: form.cnssAffiliateNumber.trim() || "A completer",
    city: form.city.trim() || "A completer",
    plan,
  };
}

function replaceCompanyInList(companies: EmployerCompany[], company: EmployerCompany) {
  return companies.some((item) => item.id === company.id)
    ? companies.map((item) => (item.id === company.id ? company : item))
    : [company, ...companies];
}

export function EmployerSettingsClient() {
  const [companies, setCompanies] = useState<EmployerCompany[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState("");
  const [form, setForm] = useState<CompanyFormState>(emptyCompanyForm);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const nextCompanies = readEmployerCompanies();
    setCompanies(nextCompanies);
    setActiveCompanyId(readActiveEmployerCompanyId(nextCompanies));

    let cancelled = false;
    fetchEmployerCompaniesFromCloud()
      .then((cloudCompanies) => {
        if (cancelled || cloudCompanies === null) return;
        writeEmployerCompanies(cloudCompanies);
        setCompanies(cloudCompanies);
        setActiveCompanyId(readActiveEmployerCompanyId(cloudCompanies));
      })
      .catch(() => {
        if (!cancelled) setMessage("Entreprises cloud indisponibles, donnees locales conservees.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const activeCompany = useMemo(
    () => companies.find((company) => company.id === activeCompanyId) ?? companies[0] ?? null,
    [activeCompanyId, companies],
  );
  const activeCapabilities = employerPlanCapabilities[activeCompany?.plan ?? "free"];
  const addAllowed = activeCompany ? canAddEmployerCompany(companies, activeCompany) : true;

  async function persistCompany(company: EmployerCompany) {
    try {
      const savedCompany = await saveEmployerCompanyToCloud(company);
      if (!savedCompany) throw new Error("unauthorized");
      const savedCompanies = replaceCompanyInList(companies, savedCompany);
      setCompanies(savedCompanies);
      writeEmployerCompanies(savedCompanies);
      return savedCompany;
    } catch {
      setMessage("Entreprise non sauvegardee. Verifiez la connexion et reessayez.");
      throw new Error("company_save_failed");
    }
  }

  function selectCompany(companyId: string) {
    setActiveCompanyId(companyId);
    writeActiveEmployerCompanyId(companyId);
  }

  function addCompany(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim()) {
      setMessage("Le nom de l'entreprise est requis.");
      return;
    }
    if (!addAllowed) {
      setMessage("Le plan actuel ne permet pas d'ajouter une deuxieme entreprise.");
      return;
    }
    const nextCompany = createCompany(form, activeCompany?.plan ?? "free");
    persistCompany(nextCompany)
      .then((savedCompany) => {
        selectCompany(savedCompany.id);
        setForm(emptyCompanyForm);
        setMessage(`${savedCompany.name} a ete ajoutee.`);
      })
      .catch(() => undefined);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <aside className="space-y-4">
        <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">Entreprise</p>
              <h2 className="mt-2 text-xl font-black">Contexte actif</h2>
            </div>
            <Building2 className="h-6 w-6 text-[var(--accent)]" />
          </div>

          <div className="mt-5 space-y-3">
            {companies.map((company) => {
              const active = company.id === activeCompany?.id;
              return (
                <button
                  key={company.id}
                  type="button"
                  onClick={() => selectCompany(company.id)}
                  className={`block w-full rounded-lg border p-4 text-left transition ${
                    active
                      ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                      : "border-[var(--line)] bg-[var(--surface-muted)] hover:border-[var(--accent)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-[var(--heading)]">{company.name}</p>
                      <p className="mt-1 text-xs text-[var(--ink-soft)]">{company.city}</p>
                    </div>
                    <span className="rounded-full bg-[var(--surface)] px-2.5 py-1 text-[11px] font-bold text-[var(--accent)]">
                      {employerPlanLabels[company.plan]}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">Ajouter</p>
          <h2 className="mt-2 text-xl font-black">Nouvelle entreprise</h2>
          {!addAllowed ? (
            <p className="mt-3 rounded-lg bg-[var(--warning-soft)] px-3 py-2 text-sm text-[#8a520f]">
              Passez au plan Cabinet RH pour gerer plusieurs entreprises.
            </p>
          ) : null}
          <form onSubmit={addCompany} className="mt-4 space-y-3">
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="input-shell"
              placeholder="Nom entreprise"
              disabled={!addAllowed}
            />
            <input
              value={form.ice}
              onChange={(event) => setForm((current) => ({ ...current, ice: event.target.value }))}
              className="input-shell"
              placeholder="ICE"
              disabled={!addAllowed}
            />
            <input
              value={form.cnssAffiliateNumber}
              onChange={(event) => setForm((current) => ({ ...current, cnssAffiliateNumber: event.target.value }))}
              className="input-shell"
              placeholder="Affiliation CNSS"
              disabled={!addAllowed}
            />
            <input
              value={form.city}
              onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
              className="input-shell"
              placeholder="Ville"
              disabled={!addAllowed}
            />
            <button
              type="submit"
              disabled={!addAllowed}
              className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-[var(--accent)] px-4 text-sm font-bold text-[var(--juris-on-primary)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus className="mr-2 h-4 w-4" />
              Ajouter
            </button>
          </form>
        </section>
      </aside>

      <section className="space-y-4">
        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">Plan & livrables</p>
          <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-black">{activeCompany?.name ?? "Aucune entreprise configuree"}</h2>
              {activeCompany ? (
                <p className="mt-2 text-sm text-[var(--ink-soft)]">
                  ICE {activeCompany.ice} - CNSS {activeCompany.cnssAffiliateNumber} - {activeCompany.city}
                </p>
              ) : (
                <p className="mt-2 text-sm text-[var(--ink-soft)]">
                  Creez la premiere entreprise pour ouvrir les modules RH, paie et declarations.
                </p>
              )}
            </div>
            <span className="inline-flex w-fit rounded-full bg-[var(--accent-soft)] px-3 py-1.5 text-sm font-black text-[var(--accent)]">
              {employerPlanLabels[activeCompany?.plan ?? "free"]}
            </span>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {planOrder.map((plan) => {
            const selected = activeCompany?.plan === plan;
            const capabilities = employerPlanCapabilities[plan];
            return (
              <div
                key={plan}
                className={`rounded-lg border p-5 text-left transition ${
                  selected
                    ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                    : "border-[var(--line)] bg-[var(--surface)]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xl font-black">{employerPlanLabels[plan]}</h3>
                  {selected ? <CheckCircle2 className="h-5 w-5 text-[var(--ok)]" /> : null}
                </div>
                <div className="mt-4 space-y-2 text-sm text-[var(--ink-soft)]">
                  <p>{capabilities.maxCompanies} entreprise(s)</p>
                  <p>{capabilities.maxEmployees} salarie(s)</p>
                  <p>{capabilities.canExportCsv ? "Exports CSV inclus" : "Exports CSV verrouilles"}</p>
                  <p>{capabilities.canDownloadPayslips ? "PDF paie inclus" : "PDF paie verrouilles"}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)]">
          <div className="border-b border-[var(--line)] p-5">
            <h2 className="text-xl font-black">Capacites actives</h2>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">Ces capacites sont lues par les modules employeur.</p>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-2">
            {[
              ["Multi-entreprise", `${companies.length}/${activeCapabilities.maxCompanies}`],
              ["Limite salaries", `${activeCapabilities.maxEmployees}`],
              ["Export CNSS CSV", activeCapabilities.canExportCsv ? "Debloque" : "Verrouille"],
              ["PDF bulletins", activeCapabilities.canDownloadPayslips ? "Debloque" : "Verrouille"],
              ["Marque blanche", activeCapabilities.canWhiteLabel ? "Debloque" : "Verrouille"],
            ].map(([label, value]) => {
              const locked = value === "Verrouille";
              return (
                <div key={label} className="flex items-center justify-between gap-3 rounded-lg bg-[var(--surface-muted)] p-4">
                  <div>
                    <p className="font-bold">{label}</p>
                    <p className={`mt-1 text-sm ${locked ? "text-[var(--err)]" : "text-[var(--ok)]"}`}>{value}</p>
                  </div>
                  {locked ? <Lock className="h-5 w-5 text-[var(--err)]" /> : <CheckCircle2 className="h-5 w-5 text-[var(--ok)]" />}
                </div>
              );
            })}
          </div>
        </div>

        {activeCompany ? <EmployerWorkspaceSyncClient /> : null}

        {message ? (
          <p className="rounded-lg bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--ink-soft)]">{message}</p>
        ) : null}
      </section>
    </div>
  );
}
