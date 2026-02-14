"use client";

import { useEffect, useMemo, useState } from "react";

type TaxBracket = {
  min: number;
  max: number | null;
  rate: number;
};

type VersionBase = {
  versionId: string;
  versionCode: string;
  effectiveFrom: string;
  effectiveTo: string | null;
};

type SalaryRules = VersionBase & {
  cnssEmployeeRate: number;
  cnssEmployerRate: number;
  cnssCeiling: number;
  amoEmployeeRate: number;
  amoEmployerRate: number;
  professionalExpenseRate: number;
  professionalExpenseCap: number;
  taxBracketsMonthly: TaxBracket[];
};

type TerminationRules = VersionBase & {
  tranche1HoursPerYear: number;
  tranche2HoursPerYear: number;
  tranche3HoursPerYear: number;
  tranche4HoursPerYear: number;
  abusiveBaseMonthsPerYear: number;
  abusiveCapMonths: number;
  legalIndemnityContractTypes: Array<"CDI" | "CDD">;
  cddNoticeDaysByCategory: {
    cadre: number;
    employe: number;
    ouvrier: number;
  };
  cdiNoticeMonthsByCategory: {
    cadre: { lt1: number; gte1lt5: number; gte5: number };
    employe: { lt1: number; gte1lt5: number; gte5: number };
    ouvrier: { lt1: number; gte1lt5: number; gte5: number };
  };
};

type LeaveRules = VersionBase & {
  accrualDaysPerMonth: number;
  seniorityBonusDaysPerMonthAfter5Years: number;
  carryoverLimitDays: number;
};

type SmigRules = VersionBase & {
  smigHourlyMad: number;
  smagDailyMad: number;
  referenceHoursPerMonth: number;
  referenceDaysPerMonth: number;
};

type OvertimeRules = VersionBase & {
  dayMultiplier: number;
  nightMultiplier: number;
  weekendMultiplier: number;
  holidayMultiplier: number;
  monthlyReferenceHours: number;
};

type SocialProtectionRules = VersionBase & {
  sickLeaveWaitingDays: number;
  sickLeaveCnssCoverageRate: number;
  sickLeaveMaxCompensatedDays: number;
  maternityCnssCoverageRate: number;
  maternityLegalLeaveWeeks: number;
  pensionMinContributionDays: number;
  pensionAccrualStepDays: number;
  pensionBaseReplacementRate: number;
  pensionIncrementPerStep: number;
  pensionMaxReplacementRate: number;
  pensionReferenceSalaryCeiling: number;
  pensionNormalRetirementAge: number;
  pensionEarlyRetirementFactor: number;
  workAccidentTemporaryCoverageRate: number;
  workAccidentPermanentCoverageCoefficient: number;
};

type LawRulesBundle = {
  salaryRules: SalaryRules[];
  terminationRules: TerminationRules[];
  leaveRules: LeaveRules[];
  smigRules: SmigRules[];
  overtimeRules: OvertimeRules[];
  socialProtectionRules: SocialProtectionRules[];
};

type RuleKey = keyof LawRulesBundle;

const RULE_SECTIONS: Array<{ key: RuleKey; title: string; help: string }> = [
  { key: "salaryRules", title: "Salaire, IR, CNSS, AMO", help: "Net/brut, cout employeur, IR annuel." },
  { key: "terminationRules", title: "Rupture et indemnites", help: "Licenciement, demission, fin CDD, essai." },
  { key: "leaveRules", title: "Conges et arrets", help: "Conges payes, maternite, maladie." },
  { key: "smigRules", title: "SMIG / SMAG", help: "Conformite minimum legal et projections." },
  { key: "overtimeRules", title: "Heures supplementaires", help: "Majorations jour/nuit/weekend/jour ferie." },
  { key: "socialProtectionRules", title: "Protection sociale", help: "Maladie, maternite, pension, accident du travail." },
];

function dateRangeLabel(rule: VersionBase) {
  return `${rule.effectiveFrom} -> ${rule.effectiveTo ?? "open"}`;
}

function numeric(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function cloneVersion<T extends VersionBase>(rule: T): T {
  const suffix = `${Date.now()}`.slice(-5);
  return {
    ...rule,
    versionId: `${rule.versionId}_v${suffix}`,
    versionCode: `${rule.versionCode}_v${suffix}`,
    effectiveFrom: new Date().toISOString().slice(0, 10),
    effectiveTo: null,
  };
}

function Field({
  label,
  value,
  onChange,
  step = "0.0001",
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: string;
}) {
  return (
    <label className="block text-xs font-semibold text-[var(--ink-soft)]">
      {label}
      <input
        type="number"
        step={step}
        value={value}
        onChange={(event) => onChange(numeric(event.target.value))}
        className="input-shell mt-1 text-sm"
      />
    </label>
  );
}

export default function AdminRulesPage() {
  const [saved, setSaved] = useState<LawRulesBundle>();
  const [draft, setDraft] = useState<LawRulesBundle>();
  const [selected, setSelected] = useState<Record<RuleKey, number>>({
    salaryRules: 0,
    terminationRules: 0,
    leaveRules: 0,
    smigRules: 0,
    overtimeRules: 0,
    socialProtectionRules: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;
    async function loadRules() {
      try {
        const response = await fetch("/api/admin/rules");
        const data = (await response.json()) as { ok: boolean; rules?: LawRulesBundle };
        if (!active || !data.ok || !data.rules) {
          setError("Impossible de charger les regles.");
          return;
        }
        setSaved(data.rules);
        setDraft(data.rules);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadRules();
    return () => {
      active = false;
    };
  }, []);

  const hasChanges = useMemo(() => {
    if (!saved || !draft) return false;
    return JSON.stringify(saved) !== JSON.stringify(draft);
  }, [saved, draft]);

  function updateVersionBase(section: RuleKey, key: keyof VersionBase, value: string) {
    if (!draft) return;
    const index = selected[section];
    const list = [...draft[section]] as Array<VersionBase>;
    list[index] = {
      ...list[index],
      [key]: key === "effectiveTo" && value.trim() === "" ? null : value,
    };
    setDraft({ ...draft, [section]: list } as LawRulesBundle);
  }

  function cloneSelected(section: RuleKey) {
    if (!draft) return;
    const list = [...draft[section]];
    const current = list[selected[section]] as VersionBase;
    const next = cloneVersion(current);
    list.push(next as (typeof list)[number]);
    setDraft({ ...draft, [section]: list } as LawRulesBundle);
    setSelected((prev) => ({ ...prev, [section]: list.length - 1 }));
  }

  function updateSalaryField(key: keyof Omit<SalaryRules, keyof VersionBase | "taxBracketsMonthly">, value: number) {
    if (!draft) return;
    const index = selected.salaryRules;
    const list = [...draft.salaryRules];
    list[index] = { ...list[index], [key]: value };
    setDraft({ ...draft, salaryRules: list });
  }

  function updateSalaryBracket(index: number, key: keyof TaxBracket, value: string) {
    if (!draft) return;
    const current = selected.salaryRules;
    const list = [...draft.salaryRules];
    const brackets = [...list[current].taxBracketsMonthly];
    brackets[index] = {
      ...brackets[index],
      [key]: key === "max" && value.trim() === "" ? null : numeric(value),
    };
    list[current] = { ...list[current], taxBracketsMonthly: brackets };
    setDraft({ ...draft, salaryRules: list });
  }

  function addSalaryBracket() {
    if (!draft) return;
    const current = selected.salaryRules;
    const list = [...draft.salaryRules];
    list[current] = {
      ...list[current],
      taxBracketsMonthly: [
        ...list[current].taxBracketsMonthly,
        { min: 0, max: null, rate: 0 },
      ],
    };
    setDraft({ ...draft, salaryRules: list });
  }

  function removeSalaryBracket(index: number) {
    if (!draft) return;
    const current = selected.salaryRules;
    const list = [...draft.salaryRules];
    if (list[current].taxBracketsMonthly.length <= 1) return;
    list[current] = {
      ...list[current],
      taxBracketsMonthly: list[current].taxBracketsMonthly.filter((_, idx) => idx !== index),
    };
    setDraft({ ...draft, salaryRules: list });
  }

  function updateTerminationField(
    key: keyof Omit<
      TerminationRules,
      keyof VersionBase | "legalIndemnityContractTypes" | "cddNoticeDaysByCategory" | "cdiNoticeMonthsByCategory"
    >,
    value: number,
  ) {
    if (!draft) return;
    const index = selected.terminationRules;
    const list = [...draft.terminationRules];
    list[index] = { ...list[index], [key]: value };
    setDraft({ ...draft, terminationRules: list });
  }

  function toggleTerminationLegalContractType(contractType: "CDI" | "CDD", checked: boolean) {
    if (!draft) return;
    const index = selected.terminationRules;
    const list = [...draft.terminationRules];
    const current = new Set(list[index].legalIndemnityContractTypes);
    if (checked) {
      current.add(contractType);
    } else {
      current.delete(contractType);
    }
    list[index] = {
      ...list[index],
      legalIndemnityContractTypes: Array.from(current),
    };
    setDraft({ ...draft, terminationRules: list });
  }

  function updateTerminationCddNoticeDays(key: "cadre" | "employe" | "ouvrier", value: number) {
    if (!draft) return;
    const index = selected.terminationRules;
    const list = [...draft.terminationRules];
    list[index] = {
      ...list[index],
      cddNoticeDaysByCategory: {
        ...list[index].cddNoticeDaysByCategory,
        [key]: value,
      },
    };
    setDraft({ ...draft, terminationRules: list });
  }

  function updateTerminationCdiNoticeMonths(
    category: "cadre" | "employe" | "ouvrier",
    tranche: "lt1" | "gte1lt5" | "gte5",
    value: number,
  ) {
    if (!draft) return;
    const index = selected.terminationRules;
    const list = [...draft.terminationRules];
    list[index] = {
      ...list[index],
      cdiNoticeMonthsByCategory: {
        ...list[index].cdiNoticeMonthsByCategory,
        [category]: {
          ...list[index].cdiNoticeMonthsByCategory[category],
          [tranche]: value,
        },
      },
    };
    setDraft({ ...draft, terminationRules: list });
  }

  function updateLeaveField(key: keyof Omit<LeaveRules, keyof VersionBase>, value: number) {
    if (!draft) return;
    const index = selected.leaveRules;
    const list = [...draft.leaveRules];
    list[index] = { ...list[index], [key]: value };
    setDraft({ ...draft, leaveRules: list });
  }

  function updateSmigField(key: keyof Omit<SmigRules, keyof VersionBase>, value: number) {
    if (!draft) return;
    const index = selected.smigRules;
    const list = [...draft.smigRules];
    list[index] = { ...list[index], [key]: value };
    setDraft({ ...draft, smigRules: list });
  }

  function updateOvertimeField(key: keyof Omit<OvertimeRules, keyof VersionBase>, value: number) {
    if (!draft) return;
    const index = selected.overtimeRules;
    const list = [...draft.overtimeRules];
    list[index] = { ...list[index], [key]: value };
    setDraft({ ...draft, overtimeRules: list });
  }

  function updateSocialProtectionField(
    key: keyof Omit<SocialProtectionRules, keyof VersionBase>,
    value: number,
  ) {
    if (!draft) return;
    const index = selected.socialProtectionRules;
    const list = [...draft.socialProtectionRules];
    list[index] = { ...list[index], [key]: value };
    setDraft({ ...draft, socialProtectionRules: list });
  }

  async function onSave() {
    if (!draft) return;
    setSaving(true);
    setStatus(undefined);
    setError(undefined);
    try {
      const response = await fetch("/api/admin/rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = (await response.json()) as { ok: boolean; rules?: LawRulesBundle; error?: string };
      if (!data.ok || !data.rules) {
        throw new Error(data.error ?? "save_failed");
      }
      setSaved(data.rules);
      setDraft(data.rules);
      setStatus("Regles enregistrees avec succes.");
    } catch {
      setError("Echec d'enregistrement: verifiez les versions et les valeurs.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <section className="soft-card rounded-3xl p-5 text-sm text-[var(--ink-soft)]">Chargement...</section>;
  }

  if (!draft) {
    return <section className="status-error rounded-3xl p-5 text-sm">{error ?? "Erreur de chargement."}</section>;
  }

  const salary = draft.salaryRules[selected.salaryRules];
  const termination = draft.terminationRules[selected.terminationRules];
  const leave = draft.leaveRules[selected.leaveRules];
  const smig = draft.smigRules[selected.smigRules];
  const overtime = draft.overtimeRules[selected.overtimeRules];
  const social = draft.socialProtectionRules[selected.socialProtectionRules];

  return (
    <div className="space-y-4">
      <section className="soft-card rounded-3xl p-5">
        <p className="section-kicker">Law Versioning</p>
        <h2 className="display-font mt-1 text-3xl font-semibold">Taxes et regles legales</h2>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Interface admin simplifiee pour maintenir les versions de regles sans toucher au code.
        </p>
      </section>

      {RULE_SECTIONS.map((section) => (
        <section key={section.key} className="soft-card rounded-3xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="display-font text-2xl font-semibold">{section.title}</h3>
              <p className="mt-1 text-xs text-[var(--ink-soft)]">{section.help}</p>
            </div>
            <button type="button" onClick={() => cloneSelected(section.key)} className="btn-muted px-4 py-2 text-sm">
              Ajouter version (clone)
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {draft[section.key].map((item, index) => (
              <button
                key={`${item.versionId}-${index}`}
                type="button"
                onClick={() => setSelected((prev) => ({ ...prev, [section.key]: index }))}
                className={`rounded-xl border px-3 py-2 text-left text-xs ${
                  selected[section.key] === index
                    ? "border-transparent bg-[var(--accent)] text-white"
                    : "border-[var(--line)] bg-[var(--surface)] text-[var(--foreground)]"
                }`}
              >
                <p className="font-semibold">{item.versionCode}</p>
                <p className={`${selected[section.key] === index ? "text-white/90" : "text-[var(--ink-soft)]"}`}>
                  {dateRangeLabel(item as VersionBase)}
                </p>
              </button>
            ))}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-[var(--ink-soft)]">
              Version ID
              <input
                value={(draft[section.key][selected[section.key]] as VersionBase).versionId}
                onChange={(event) => updateVersionBase(section.key, "versionId", event.target.value)}
                className="input-shell mt-1 text-sm"
              />
            </label>
            <label className="block text-xs font-semibold text-[var(--ink-soft)]">
              Version Code
              <input
                value={(draft[section.key][selected[section.key]] as VersionBase).versionCode}
                onChange={(event) => updateVersionBase(section.key, "versionCode", event.target.value)}
                className="input-shell mt-1 text-sm"
              />
            </label>
            <label className="block text-xs font-semibold text-[var(--ink-soft)]">
              Effective From
              <input
                type="date"
                value={(draft[section.key][selected[section.key]] as VersionBase).effectiveFrom}
                onChange={(event) => updateVersionBase(section.key, "effectiveFrom", event.target.value)}
                className="input-shell mt-1 text-sm"
              />
            </label>
            <label className="block text-xs font-semibold text-[var(--ink-soft)]">
              Effective To (vide = ouvert)
              <input
                type="date"
                value={(draft[section.key][selected[section.key]] as VersionBase).effectiveTo ?? ""}
                onChange={(event) => updateVersionBase(section.key, "effectiveTo", event.target.value)}
                className="input-shell mt-1 text-sm"
              />
            </label>
          </div>
        </section>
      ))}

      <section className="soft-card rounded-3xl p-5">
        <h3 className="display-font text-2xl font-semibold">Detail Salaire / Tax</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="CNSS Employe" value={salary.cnssEmployeeRate} onChange={(v) => updateSalaryField("cnssEmployeeRate", v)} />
          <Field label="CNSS Employeur" value={salary.cnssEmployerRate} onChange={(v) => updateSalaryField("cnssEmployerRate", v)} />
          <Field label="Plafond CNSS" value={salary.cnssCeiling} onChange={(v) => updateSalaryField("cnssCeiling", v)} step="0.01" />
          <Field label="AMO Employe" value={salary.amoEmployeeRate} onChange={(v) => updateSalaryField("amoEmployeeRate", v)} />
          <Field label="AMO Employeur" value={salary.amoEmployerRate} onChange={(v) => updateSalaryField("amoEmployerRate", v)} />
          <Field label="Frais Pro Rate" value={salary.professionalExpenseRate} onChange={(v) => updateSalaryField("professionalExpenseRate", v)} />
          <Field label="Plafond Frais Pro" value={salary.professionalExpenseCap} onChange={(v) => updateSalaryField("professionalExpenseCap", v)} step="0.01" />
        </div>

        <div className="mt-4 rounded-2xl border border-[var(--line)] p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold">Tranches IR mensuelles</p>
            <button type="button" onClick={addSalaryBracket} className="btn-muted px-3 py-1 text-xs">
              Ajouter tranche
            </button>
          </div>
          <div className="space-y-2">
            {salary.taxBracketsMonthly.map((bracket, index) => (
              <div key={`${index}-${bracket.min}-${bracket.rate}`} className="grid grid-cols-12 gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={bracket.min}
                  onChange={(event) => updateSalaryBracket(index, "min", event.target.value)}
                  className="input-shell col-span-4 text-sm"
                  placeholder="Min"
                />
                <input
                  type="number"
                  step="0.01"
                  value={bracket.max ?? ""}
                  onChange={(event) => updateSalaryBracket(index, "max", event.target.value)}
                  className="input-shell col-span-4 text-sm"
                  placeholder="Max vide = infini"
                />
                <input
                  type="number"
                  step="0.0001"
                  value={bracket.rate}
                  onChange={(event) => updateSalaryBracket(index, "rate", event.target.value)}
                  className="input-shell col-span-3 text-sm"
                  placeholder="Rate"
                />
                <button
                  type="button"
                  onClick={() => removeSalaryBracket(index)}
                  className="btn-muted col-span-1 px-2 py-1 text-xs"
                  title="Supprimer"
                >
                  X
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="soft-card rounded-3xl p-5">
        <h3 className="display-font text-2xl font-semibold">Detail Rupture</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="T1 h/an" value={termination.tranche1HoursPerYear} onChange={(v) => updateTerminationField("tranche1HoursPerYear", v)} step="0.01" />
          <Field label="T2 h/an" value={termination.tranche2HoursPerYear} onChange={(v) => updateTerminationField("tranche2HoursPerYear", v)} step="0.01" />
          <Field label="T3 h/an" value={termination.tranche3HoursPerYear} onChange={(v) => updateTerminationField("tranche3HoursPerYear", v)} step="0.01" />
          <Field label="T4 h/an" value={termination.tranche4HoursPerYear} onChange={(v) => updateTerminationField("tranche4HoursPerYear", v)} step="0.01" />
          <Field label="Base abusive (mois/an)" value={termination.abusiveBaseMonthsPerYear} onChange={(v) => updateTerminationField("abusiveBaseMonthsPerYear", v)} step="0.01" />
          <Field label="Cap abusive (mois)" value={termination.abusiveCapMonths} onChange={(v) => updateTerminationField("abusiveCapMonths", v)} step="0.01" />
        </div>
        <div className="mt-4 rounded-2xl border border-[var(--line)] p-3">
          <p className="text-sm font-semibold">Contrats eligibles indemnites legales</p>
          <div className="mt-2 flex flex-wrap gap-3 text-sm">
            {(["CDI", "CDD"] as const).map((contractType) => (
              <label key={contractType} className="panel-strong flex items-center gap-2 rounded-xl px-3 py-2">
                <input
                  type="checkbox"
                  checked={termination.legalIndemnityContractTypes.includes(contractType)}
                  onChange={(event) => toggleTerminationLegalContractType(contractType, event.target.checked)}
                />
                {contractType}
              </label>
            ))}
          </div>
        </div>
        <div className="mt-4 rounded-2xl border border-[var(--line)] p-3">
          <p className="text-sm font-semibold">Preavis CDD (jours)</p>
          <div className="mt-2 grid gap-3 sm:grid-cols-3">
            <Field
              label="Cadre"
              value={termination.cddNoticeDaysByCategory.cadre}
              onChange={(v) => updateTerminationCddNoticeDays("cadre", v)}
              step="0.01"
            />
            <Field
              label="Employe"
              value={termination.cddNoticeDaysByCategory.employe}
              onChange={(v) => updateTerminationCddNoticeDays("employe", v)}
              step="0.01"
            />
            <Field
              label="Ouvrier"
              value={termination.cddNoticeDaysByCategory.ouvrier}
              onChange={(v) => updateTerminationCddNoticeDays("ouvrier", v)}
              step="0.01"
            />
          </div>
        </div>
        <div className="mt-4 rounded-2xl border border-[var(--line)] p-3">
          <p className="text-sm font-semibold">Preavis CDI (mois)</p>
          <div className="mt-2 space-y-3">
            {(["cadre", "employe", "ouvrier"] as const).map((category) => (
              <div key={category} className="rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">{category}</p>
                <div className="mt-2 grid gap-3 sm:grid-cols-3">
                  <Field
                    label="< 1 an"
                    value={termination.cdiNoticeMonthsByCategory[category].lt1}
                    onChange={(v) => updateTerminationCdiNoticeMonths(category, "lt1", v)}
                    step="0.01"
                  />
                  <Field
                    label="1 a < 5 ans"
                    value={termination.cdiNoticeMonthsByCategory[category].gte1lt5}
                    onChange={(v) => updateTerminationCdiNoticeMonths(category, "gte1lt5", v)}
                    step="0.01"
                  />
                  <Field
                    label=">= 5 ans"
                    value={termination.cdiNoticeMonthsByCategory[category].gte5}
                    onChange={(v) => updateTerminationCdiNoticeMonths(category, "gte5", v)}
                    step="0.01"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="soft-card rounded-3xl p-5">
        <h3 className="display-font text-2xl font-semibold">Detail Conges</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Jours/mois" value={leave.accrualDaysPerMonth} onChange={(v) => updateLeaveField("accrualDaysPerMonth", v)} step="0.01" />
          <Field label="Bonus anciennete/mois" value={leave.seniorityBonusDaysPerMonthAfter5Years} onChange={(v) => updateLeaveField("seniorityBonusDaysPerMonthAfter5Years", v)} step="0.01" />
          <Field label="Plafond report" value={leave.carryoverLimitDays} onChange={(v) => updateLeaveField("carryoverLimitDays", v)} step="0.01" />
        </div>
      </section>

      <section className="soft-card rounded-3xl p-5">
        <h3 className="display-font text-2xl font-semibold">Detail SMIG / SMAG</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="SMIG horaire" value={smig.smigHourlyMad} onChange={(v) => updateSmigField("smigHourlyMad", v)} step="0.01" />
          <Field label="SMAG journalier" value={smig.smagDailyMad} onChange={(v) => updateSmigField("smagDailyMad", v)} step="0.01" />
          <Field label="Heures/mois" value={smig.referenceHoursPerMonth} onChange={(v) => updateSmigField("referenceHoursPerMonth", v)} step="0.01" />
          <Field label="Jours/mois" value={smig.referenceDaysPerMonth} onChange={(v) => updateSmigField("referenceDaysPerMonth", v)} step="0.01" />
        </div>
      </section>

      <section className="soft-card rounded-3xl p-5">
        <h3 className="display-font text-2xl font-semibold">Detail Heures Supplementaires</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Jour x" value={overtime.dayMultiplier} onChange={(v) => updateOvertimeField("dayMultiplier", v)} />
          <Field label="Nuit x" value={overtime.nightMultiplier} onChange={(v) => updateOvertimeField("nightMultiplier", v)} />
          <Field label="Weekend x" value={overtime.weekendMultiplier} onChange={(v) => updateOvertimeField("weekendMultiplier", v)} />
          <Field label="Ferie x" value={overtime.holidayMultiplier} onChange={(v) => updateOvertimeField("holidayMultiplier", v)} />
          <Field label="Ref h/mois" value={overtime.monthlyReferenceHours} onChange={(v) => updateOvertimeField("monthlyReferenceHours", v)} step="0.01" />
        </div>
      </section>

      <section className="soft-card rounded-3xl p-5">
        <h3 className="display-font text-2xl font-semibold">Detail Protection Sociale</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Maladie carence (jours)" value={social.sickLeaveWaitingDays} onChange={(v) => updateSocialProtectionField("sickLeaveWaitingDays", v)} step="0.01" />
          <Field label="Maladie taux CNSS" value={social.sickLeaveCnssCoverageRate} onChange={(v) => updateSocialProtectionField("sickLeaveCnssCoverageRate", v)} />
          <Field label="Maladie max jours" value={social.sickLeaveMaxCompensatedDays} onChange={(v) => updateSocialProtectionField("sickLeaveMaxCompensatedDays", v)} step="0.01" />
          <Field label="Maternite taux CNSS" value={social.maternityCnssCoverageRate} onChange={(v) => updateSocialProtectionField("maternityCnssCoverageRate", v)} />
          <Field label="Maternite semaines legale" value={social.maternityLegalLeaveWeeks} onChange={(v) => updateSocialProtectionField("maternityLegalLeaveWeeks", v)} step="0.01" />
          <Field label="Pension min jours" value={social.pensionMinContributionDays} onChange={(v) => updateSocialProtectionField("pensionMinContributionDays", v)} step="0.01" />
          <Field label="Pension step jours" value={social.pensionAccrualStepDays} onChange={(v) => updateSocialProtectionField("pensionAccrualStepDays", v)} step="0.01" />
          <Field label="Pension base taux" value={social.pensionBaseReplacementRate} onChange={(v) => updateSocialProtectionField("pensionBaseReplacementRate", v)} />
          <Field label="Pension + par step" value={social.pensionIncrementPerStep} onChange={(v) => updateSocialProtectionField("pensionIncrementPerStep", v)} />
          <Field label="Pension taux max" value={social.pensionMaxReplacementRate} onChange={(v) => updateSocialProtectionField("pensionMaxReplacementRate", v)} />
          <Field label="Pension plafond salaire" value={social.pensionReferenceSalaryCeiling} onChange={(v) => updateSocialProtectionField("pensionReferenceSalaryCeiling", v)} step="0.01" />
          <Field label="Pension age normal" value={social.pensionNormalRetirementAge} onChange={(v) => updateSocialProtectionField("pensionNormalRetirementAge", v)} step="0.01" />
          <Field label="Pension facteur anticipe" value={social.pensionEarlyRetirementFactor} onChange={(v) => updateSocialProtectionField("pensionEarlyRetirementFactor", v)} />
          <Field label="AT taux temporaire" value={social.workAccidentTemporaryCoverageRate} onChange={(v) => updateSocialProtectionField("workAccidentTemporaryCoverageRate", v)} />
          <Field label="AT coeff permanent" value={social.workAccidentPermanentCoverageCoefficient} onChange={(v) => updateSocialProtectionField("workAccidentPermanentCoverageCoefficient", v)} />
        </div>
      </section>

      <section className="soft-card rounded-3xl p-5">
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={onSave} disabled={saving || !hasChanges} className="btn-primary px-4 py-2 text-sm">
            {saving ? "Enregistrement..." : "Publier les regles"}
          </button>
          <button
            type="button"
            onClick={() => {
              if (saved) setDraft(saved);
              setStatus(undefined);
              setError(undefined);
            }}
            className="btn-muted px-4 py-2 text-sm"
            disabled={!hasChanges}
          >
            Annuler les changements
          </button>
          <p className="text-xs text-[var(--ink-soft)]">
            {hasChanges ? "Modifications non enregistrees." : "Aucune modification en attente."}
          </p>
        </div>
        {status ? <p className="status-success mt-3 rounded-xl px-3 py-2 text-sm">{status}</p> : null}
        {error ? <p className="status-error mt-3 rounded-xl px-3 py-2 text-sm">{error}</p> : null}
      </section>
    </div>
  );
}
