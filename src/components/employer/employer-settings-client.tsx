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
  legalForm: string;
  address: string;
  ice: string;
  taxIdentifier: string;
  rcNumber: string;
  cnssAffiliateNumber: string;
  city: string;
  contactEmail: string;
  bankRib: string;
  signatoryName: string;
  signatoryRole: string;
};

const emptyCompanyForm: CompanyFormState = {
  name: "",
  legalForm: "",
  address: "",
  ice: "",
  taxIdentifier: "",
  rcNumber: "",
  cnssAffiliateNumber: "",
  city: "",
  contactEmail: "",
  bankRib: "",
  signatoryName: "",
  signatoryRole: "",
};

const planOrder: EmployerPlan[] = ["free", "pro", "cabinet"];

function createCompany(form: CompanyFormState, plan: EmployerPlan): EmployerCompany {
  return {
    id: crypto.randomUUID(),
    name: form.name.trim(),
    legalForm: form.legalForm.trim() || undefined,
    address: form.address.trim() || undefined,
    ice: form.ice.trim() || "A completer",
    taxIdentifier: form.taxIdentifier.trim() || undefined,
    rcNumber: form.rcNumber.trim() || undefined,
    cnssAffiliateNumber: form.cnssAffiliateNumber.trim() || "A completer",
    city: form.city.trim() || "A completer",
    contactEmail: form.contactEmail.trim() || undefined,
    bankRib: form.bankRib.trim() || undefined,
    signatoryName: form.signatoryName.trim() || undefined,
    signatoryRole: form.signatoryRole.trim() || undefined,
    plan,
  };
}

function companyToForm(company: EmployerCompany | null): CompanyFormState {
  if (!company) return emptyCompanyForm;
  return {
    name: company.name,
    legalForm: company.legalForm ?? "",
    address: company.address ?? "",
    ice: company.ice === "A completer" ? "" : company.ice,
    taxIdentifier: company.taxIdentifier ?? "",
    rcNumber: company.rcNumber ?? "",
    cnssAffiliateNumber: company.cnssAffiliateNumber === "A completer" ? "" : company.cnssAffiliateNumber,
    city: company.city === "A completer" ? "" : company.city,
    contactEmail: company.contactEmail ?? "",
    bankRib: company.bankRib ?? "",
    signatoryName: company.signatoryName ?? "",
    signatoryRole: company.signatoryRole ?? "",
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
  const [profileForm, setProfileForm] = useState<CompanyFormState>(emptyCompanyForm);
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

  useEffect(() => {
    setProfileForm(companyToForm(activeCompany));
  }, [activeCompany?.id]);

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

  function updateProfileForm<K extends keyof CompanyFormState>(key: K, value: CompanyFormState[K]) {
    setProfileForm((current) => ({ ...current, [key]: value }));
  }

  function updateCompanyProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeCompany) return;
    if (!profileForm.name.trim()) {
      setMessage("Le nom de l'entreprise est requis.");
      return;
    }
    const email = profileForm.contactEmail.trim();
    if (email && !email.includes("@")) {
      setMessage("L'email de contact doit etre valide.");
      return;
    }

    const nextCompany: EmployerCompany = {
      ...activeCompany,
      name: profileForm.name.trim(),
      legalForm: profileForm.legalForm.trim() || undefined,
      address: profileForm.address.trim() || undefined,
      ice: profileForm.ice.trim() || "A completer",
      taxIdentifier: profileForm.taxIdentifier.trim() || undefined,
      rcNumber: profileForm.rcNumber.trim() || undefined,
      cnssAffiliateNumber: profileForm.cnssAffiliateNumber.trim() || "A completer",
      city: profileForm.city.trim() || "A completer",
      contactEmail: email || undefined,
      bankRib: profileForm.bankRib.trim() || undefined,
      signatoryName: profileForm.signatoryName.trim() || undefined,
      signatoryRole: profileForm.signatoryRole.trim() || undefined,
    };

    persistCompany(nextCompany)
      .then((savedCompany) => {
        setProfileForm(companyToForm(savedCompany));
        setMessage("Profil entreprise sauvegarde.");
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
              required
              disabled={!addAllowed}
            />
            <input
              value={form.legalForm}
              onChange={(event) => setForm((current) => ({ ...current, legalForm: event.target.value }))}
              className="input-shell"
              placeholder="Forme juridique (SARL, SA...)"
              disabled={!addAllowed}
            />
            <input
              value={form.address}
              onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
              className="input-shell"
              placeholder="Adresse siege"
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

        {activeCompany ? (
          <form onSubmit={updateCompanyProfile} className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">Profil entreprise</p>
            <h2 className="mt-2 text-xl font-black">Informations legales et paie</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-xs font-bold text-[var(--ink-soft)]">Raison sociale</span>
                <input
                  value={profileForm.name}
                  onChange={(event) => updateProfileForm("name", event.target.value)}
                  className="input-shell mt-1"
                  required
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-[var(--ink-soft)]">Forme juridique</span>
                <input
                  value={profileForm.legalForm}
                  onChange={(event) => updateProfileForm("legalForm", event.target.value)}
                  className="input-shell mt-1"
                  placeholder="SARL, SA, SNC..."
                />
              </label>
              <label className="block md:col-span-2">
                <span className="text-xs font-bold text-[var(--ink-soft)]">Adresse siege</span>
                <input
                  value={profileForm.address}
                  onChange={(event) => updateProfileForm("address", event.target.value)}
                  className="input-shell mt-1"
                  placeholder="Adresse complete"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-[var(--ink-soft)]">ICE</span>
                <input
                  value={profileForm.ice}
                  onChange={(event) => updateProfileForm("ice", event.target.value)}
                  className="input-shell mt-1"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-[var(--ink-soft)]">Identifiant fiscal</span>
                <input
                  value={profileForm.taxIdentifier}
                  onChange={(event) => updateProfileForm("taxIdentifier", event.target.value)}
                  className="input-shell mt-1"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-[var(--ink-soft)]">RC</span>
                <input
                  value={profileForm.rcNumber}
                  onChange={(event) => updateProfileForm("rcNumber", event.target.value)}
                  className="input-shell mt-1"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-[var(--ink-soft)]">Affiliation CNSS</span>
                <input
                  value={profileForm.cnssAffiliateNumber}
                  onChange={(event) => updateProfileForm("cnssAffiliateNumber", event.target.value)}
                  className="input-shell mt-1"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-[var(--ink-soft)]">Ville</span>
                <input
                  value={profileForm.city}
                  onChange={(event) => updateProfileForm("city", event.target.value)}
                  className="input-shell mt-1"
                  required
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-[var(--ink-soft)]">Email contact RH</span>
                <input
                  type="email"
                  value={profileForm.contactEmail}
                  onChange={(event) => updateProfileForm("contactEmail", event.target.value)}
                  className="input-shell mt-1"
                />
              </label>
              <label className="block md:col-span-2">
                <span className="text-xs font-bold text-[var(--ink-soft)]">RIB entreprise</span>
                <input
                  value={profileForm.bankRib}
                  onChange={(event) => updateProfileForm("bankRib", event.target.value)}
                  className="input-shell mt-1"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-[var(--ink-soft)]">Signataire</span>
                <input
                  value={profileForm.signatoryName}
                  onChange={(event) => updateProfileForm("signatoryName", event.target.value)}
                  className="input-shell mt-1"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-[var(--ink-soft)]">Fonction signataire</span>
                <input
                  value={profileForm.signatoryRole}
                  onChange={(event) => updateProfileForm("signatoryRole", event.target.value)}
                  className="input-shell mt-1"
                />
              </label>
            </div>
            <button
              type="submit"
              className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-[var(--accent)] px-4 text-sm font-bold text-[var(--juris-on-primary)]"
            >
              Sauvegarder le profil
            </button>
          </form>
        ) : null}

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
