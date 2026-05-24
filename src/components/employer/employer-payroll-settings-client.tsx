"use client";

import { useEffect, useState } from "react";
import { Plus, Save, Settings2 } from "lucide-react";
import {
  employerPayrollRubricCategoryLabels,
  type EmployerPayrollAccountingAccounts,
  type EmployerPayrollRubric,
  type EmployerPayrollRubricCategory,
  type EmployerPayrollSettings,
} from "@/lib/employer/portal-data";
import { getActiveEmployerCompany, readEmployerCompanies } from "@/lib/employer/company-store";
import {
  fetchEmployerPayrollSettingsFromCloud,
  readEmployerPayrollSettings,
  saveEmployerPayrollSettingsToCloud,
  writeEmployerPayrollSettings,
} from "@/lib/employer/payroll-settings-store";

const emptyRubric: Omit<EmployerPayrollRubric, "id"> = {
  label: "",
  category: "bonus",
  taxable: true,
  cnssSubject: true,
  amoSubject: true,
  active: true,
};

export function EmployerPayrollSettingsClient() {
  const [settings, setSettings] = useState<EmployerPayrollSettings | null>(null);
  const [companyId, setCompanyId] = useState("");
  const [rubricForm, setRubricForm] = useState(emptyRubric);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const activeCompany = getActiveEmployerCompany(readEmployerCompanies());
    setCompanyId(activeCompany?.id ?? "");
    setSettings(readEmployerPayrollSettings());
    if (!activeCompany) return;

    let cancelled = false;
    fetchEmployerPayrollSettingsFromCloud(activeCompany.id)
      .then((cloudSettings) => {
        if (cancelled || !cloudSettings) return;
        setSettings(cloudSettings);
        writeEmployerPayrollSettings(cloudSettings);
      })
      .catch(() => {
        if (!cancelled) setMessage("Parametres de paie cloud indisponibles, donnees locales conservees.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!settings) return null;
  const currentSettings = settings;

  function persist(nextSettings: EmployerPayrollSettings, successMessage = "Parametres de paie sauvegardes.") {
    setSettings(nextSettings);
    writeEmployerPayrollSettings(nextSettings);
    setMessage(successMessage);
    if (!companyId) return;
    saveEmployerPayrollSettingsToCloud(companyId, nextSettings)
      .then((savedSettings) => {
        if (!savedSettings) return;
        setSettings(savedSettings);
        writeEmployerPayrollSettings(savedSettings);
      })
      .catch(() => setMessage("Parametres sauvegardes localement, synchro cloud impossible."));
  }

  function updateSetting<K extends keyof EmployerPayrollSettings>(key: K, value: EmployerPayrollSettings[K]) {
    persist({ ...currentSettings, [key]: value });
  }

  function updateAccountingAccount(key: keyof EmployerPayrollAccountingAccounts, value: string) {
    persist({
      ...currentSettings,
      accountingAccounts: {
        ...currentSettings.accountingAccounts,
        [key]: value.trim(),
      },
    });
  }

  function addRubric() {
    const label = rubricForm.label.trim();
    if (!label) return;
    persist(
      {
        ...currentSettings,
        rubrics: [...currentSettings.rubrics, { ...rubricForm, id: crypto.randomUUID(), label }],
      },
      "Rubrique ajoutee.",
    );
    setRubricForm(emptyRubric);
  }

  function updateRubric(id: string, patch: Partial<EmployerPayrollRubric>) {
    persist({
      ...currentSettings,
      rubrics: currentSettings.rubrics.map((rubric) => (rubric.id === id ? { ...rubric, ...patch } : rubric)),
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <aside className="space-y-4">
        <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">Defaults</p>
              <h2 className="mt-2 text-xl font-black">Parametres mensuels</h2>
            </div>
            <Settings2 className="h-6 w-6 text-[var(--accent)]" />
          </div>

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-xs font-bold text-[var(--ink-soft)]">Taille entreprise par defaut</span>
              <select
                value={settings.defaultCompanySize}
                onChange={(event) => updateSetting("defaultCompanySize", event.target.value as "small" | "large")}
                className="input-shell mt-1"
              >
                <option value="small">Petite</option>
                <option value="large">Grande</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-bold text-[var(--ink-soft)]">Mode de paiement</span>
              <select
                value={settings.paymentMethod}
                onChange={(event) => updateSetting("paymentMethod", event.target.value as EmployerPayrollSettings["paymentMethod"])}
                className="input-shell mt-1"
              >
                <option value="bank_transfer">Virement bancaire</option>
                <option value="cash">Especes</option>
                <option value="mixed">Mixte</option>
              </select>
            </label>
            <label className="flex items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] px-3 py-3 text-sm font-bold">
              <input
                type="checkbox"
                checked={settings.includeCimrByDefault}
                onChange={(event) => updateSetting("includeCimrByDefault", event.target.checked)}
                className="h-4 w-4 accent-[var(--accent)]"
              />
              Inclure CIMR par defaut
            </label>
            <label className="block">
              <span className="text-xs font-bold text-[var(--ink-soft)]">Format journal comptable</span>
              <select
                value={settings.accountingExportTemplate}
                onChange={(event) =>
                  updateSetting("accountingExportTemplate", event.target.value as EmployerPayrollSettings["accountingExportTemplate"])
                }
                className="input-shell mt-1"
              >
                <option value="generic">Generique CSV</option>
                <option value="sage">Sage</option>
                <option value="odoo">Odoo</option>
                <option value="webisoft">Webisoft</option>
              </select>
            </label>
            {message ? <p className="rounded-lg bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--ink-soft)]">{message}</p> : null}
          </div>
        </section>

        <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">Comptabilite</p>
          <h2 className="mt-2 text-xl font-black">Comptes paie</h2>
          <div className="mt-4 space-y-3">
            {[
              ["grossSalaryExpense", "Charges salaires bruts"],
              ["employerSocialChargesExpense", "Charges sociales patronales"],
              ["socialPayable", "Organismes sociaux a payer"],
              ["incomeTaxPayable", "IR salaires a payer"],
              ["cimrPayable", "CIMR a payer"],
              ["netSalaryPayable", "Salaires nets a payer"],
            ].map(([key, label]) => (
              <label key={key} className="block">
                <span className="text-xs font-bold text-[var(--ink-soft)]">{label}</span>
                <input
                  value={settings.accountingAccounts[key as keyof EmployerPayrollAccountingAccounts]}
                  onChange={(event) => updateAccountingAccount(key as keyof EmployerPayrollAccountingAccounts, event.target.value)}
                  className="input-shell mt-1"
                />
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">Nouvelle rubrique</p>
          <div className="mt-4 space-y-3">
            <input
              value={rubricForm.label}
              onChange={(event) => setRubricForm((current) => ({ ...current, label: event.target.value }))}
              className="input-shell"
              placeholder="Ex: Prime panier"
            />
            <select
              value={rubricForm.category}
              onChange={(event) => setRubricForm((current) => ({ ...current, category: event.target.value as EmployerPayrollRubricCategory }))}
              className="input-shell"
            >
              {Object.entries(employerPayrollRubricCategoryLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            {(["taxable", "cnssSubject", "amoSubject"] as const).map((key) => (
              <label key={key} className="flex items-center gap-2 text-sm font-bold">
                <input
                  type="checkbox"
                  checked={rubricForm[key]}
                  onChange={(event) => setRubricForm((current) => ({ ...current, [key]: event.target.checked }))}
                  className="h-4 w-4 accent-[var(--accent)]"
                />
                {key === "taxable" ? "Imposable IR" : key === "cnssSubject" ? "Soumise CNSS" : "Soumise AMO"}
              </label>
            ))}
            <button type="button" onClick={addRubric} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-sm font-black text-[var(--juris-on-primary)]">
              <Plus className="h-4 w-4" />
              Ajouter
            </button>
          </div>
        </section>
      </aside>

      <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)]">
        <div className="border-b border-[var(--line)] p-5">
          <h2 className="text-xl font-black">Rubriques de paie</h2>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">Base de saisie des primes, avantages en nature, indemnites et retenues.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-[var(--surface-muted)] text-xs font-black uppercase tracking-[0.12em] text-[var(--ink-soft)]">
              <tr>
                <th className="px-5 py-3">Libelle</th>
                <th className="px-5 py-3">Categorie</th>
                <th className="px-5 py-3">IR</th>
                <th className="px-5 py-3">CNSS</th>
                <th className="px-5 py-3">AMO</th>
                <th className="px-5 py-3">Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {settings.rubrics.map((rubric) => (
                <tr key={rubric.id}>
                  <td className="px-5 py-4 font-black">{rubric.label}</td>
                  <td className="px-5 py-4">{employerPayrollRubricCategoryLabels[rubric.category]}</td>
                  {(["taxable", "cnssSubject", "amoSubject", "active"] as const).map((key) => (
                    <td key={key} className="px-5 py-4">
                      <input
                        type="checkbox"
                        checked={rubric[key]}
                        onChange={(event) => updateRubric(rubric.id, { [key]: event.target.checked })}
                        className="h-4 w-4 accent-[var(--accent)]"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-[var(--line)] p-5 text-sm text-[var(--ink-soft)]">
          <Save className="mr-2 inline h-4 w-4" />
          Les changements sont sauvegardes dans le contexte entreprise actif.
        </div>
      </section>
    </div>
  );
}
