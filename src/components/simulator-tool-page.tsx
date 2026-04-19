"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PartnerAdSection } from "@/components/partner-ad-section";
import { useLanguage } from "@/components/language-provider";
import { usePublicConfig } from "@/components/public-config-provider";
import { RelatedContent } from "@/components/related-content";
import { JsonLd } from "@/components/json-ld";
import { trackEvent } from "@/lib/analytics/client";
import { canUseTool, resolveToolPolicy } from "@/lib/tools/tool-access";
import {
  localizeBreakdownLabel,
  localizeCalculatorDescription,
  localizeCalculatorTitle,
  localizeFieldLabel,
  localizeOptionLabel,
} from "@/lib/i18n/simulator-localization";
import { writeSimulationResultSnapshot } from "@/lib/simulations/result-snapshot";
import { absoluteUrl } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import {
  SmartDate, 
  SmartAmount, 
  SmartToggle, 
  SmartRadioCards, 
  SmartStepper,
  SmartLookup,
  SmartTagInput
} from "@/components/ui/smart-inputs";

type FieldType = "number" | "date" | "checkbox" | "select" | "text" | "amount" | "stepper" | "tags" | "lookup";

type FieldOption = {
  label: string;
  value: string;
  description?: string;
  icon?: React.ReactNode;
};

export type SimulatorField = {
  key: string;
  label: string;
  type: FieldType;
  defaultValue: string | boolean | number | string[];
  min?: number;
  max?: number;
  step?: number;
  options?: FieldOption[];
  subtitle?: string;
  visibleIf?: (values: Record<string, any>) => boolean;
};

type GenericSimulationResult = {
  versionCode: string;
  breakdown: Record<string, string | number | boolean>;
  explanation?: {
    summary: string;
    assumptions: string[];
    formulas: string[];
    warnings: string[];
    nextSteps: string[];
  };
};

type SimulatorToolPageProps = {
  title: string;
  description: string;
  apiPath: string;
  calculatorType: string;
  fields: SimulatorField[];
  breakdownLabels: Record<string, string>;
  units?: Record<string, string>;
};

type ValuesState = Record<string, string | boolean | number | string[]>;
type FormStatusTone = "success" | "warning" | "error" | "info";

type SimulationHistoryEntry = {
  id: string;
  calculatorType: string;
  title: string;
  generatedAt: string;
  primaryMetricLabel: string;
  primaryMetricValue: string;
};

const HISTORY_STORAGE_KEY = "salarie_simulation_history";

function createInitialState(fields: SimulatorField[]): ValuesState {
  const state: ValuesState = {};
  for (const field of fields) {
    state[field.key] = field.defaultValue;
  }
  return state;
}

function toPayload(values: ValuesState, fields: SimulatorField[]) {
  const payload: Record<string, unknown> = {};
  for (const field of fields) {
    const value = values[field.key];
    if (field.type === "checkbox") {
      payload[field.key] = Boolean(value);
    } else if (field.type === "number") {
      payload[field.key] = Number(value);
    } else {
      payload[field.key] = value;
    }
  }
  return payload;
}

function getVisibleFields(fields: SimulatorField[], values: ValuesState): SimulatorField[] {
  return fields.filter((field) => (field.visibleIf ? field.visibleIf(values) : true));
}

function parseHistoryEntries(raw: string | null): SimulationHistoryEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry) => {
      if (!entry || typeof entry !== "object") return false;
      const candidate = entry as Record<string, unknown>;
      return (
        typeof candidate.id === "string" &&
        typeof candidate.calculatorType === "string" &&
        typeof candidate.title === "string" &&
        typeof candidate.generatedAt === "string" &&
        typeof candidate.primaryMetricLabel === "string" &&
        typeof candidate.primaryMetricValue === "string"
      );
    }) as SimulationHistoryEntry[];
  } catch {
    return [];
  }
}

function buildFieldErrors(fields: SimulatorField[], values: ValuesState): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const field of fields) {
    if (field.type === "checkbox") continue;

    const value = values[field.key];

    if (field.type === "tags") {
      const tags = Array.isArray(value) ? value : [];
      if (tags.length === 0) {
        errors[field.key] = "Champ requis";
      }
      continue;
    }

    const rawValue = String(value ?? "").trim();
    if (!rawValue) {
      errors[field.key] = "Champ requis";
      continue;
    }

    if (field.type === "number" || field.type === "amount" || field.type === "stepper") {
      const parsed = Number(rawValue);
      if (!Number.isFinite(parsed)) {
        errors[field.key] = "Valeur numerique invalide";
        continue;
      }
      if (typeof field.min === "number" && parsed < field.min) {
        errors[field.key] = `Valeur minimale: ${field.min}`;
        continue;
      }
      if (typeof field.max === "number" && parsed > field.max) {
        errors[field.key] = `Valeur maximale: ${field.max}`;
        continue;
      }
    }

    if ((field.type === "select" || field.type === "lookup") && field.options?.length) {
      const optionExists = field.options.some((option) => option.value === rawValue);
      if (!optionExists) {
        errors[field.key] = "Option invalide";
      }
    }
  }

  return errors;
}

function pickPrimaryMetric(
  result: GenericSimulationResult,
  labels: Record<string, string>,
  units: Record<string, string>,
  locale: string,
): { label: string; value: string } {
  const priorityKeys = [
    "totalEstimated",
    "totalClaimAmount",
    "totalOvertimeAmount",
    "net",
    "estimatedMonthlyPension",
    "cnssCompensation",
    "compensationAmount",
    "employerTotalCost",
  ];

  const entries = Object.entries(result?.breakdown ?? {});
  let selectedEntry = entries.find(([key, value]) => priorityKeys.includes(key) && typeof value === "number");
  if (!selectedEntry) {
    selectedEntry = entries.find(([, value]) => typeof value === "number") ?? entries[0];
  }

  if (!selectedEntry) {
    return { label: "Resultat", value: "Disponible" };
  }

  const [key, rawValue] = selectedEntry;
  const label = labels[key] ?? key;
  if (typeof rawValue === "number") {
    const unit = units[key] ? ` ${units[key]}` : "";
    return { label, value: `${rawValue.toLocaleString(locale)}${unit}` };
  }
  if (typeof rawValue === "boolean") {
    return { label, value: rawValue ? "Oui" : "Non" };
  }
  return { label, value: String(rawValue) };
}

function formatPreviewValue(
  value: any,
  field: SimulatorField,
  locale: string,
  yesLabel: string,
  noLabel: string,
) {
  if (field.type === "checkbox") {
    return value ? yesLabel : noLabel;
  }
  if (Array.isArray(value)) {
    return (value as string[]).join(", ");
  }
  if ((field.type === "number" || field.type === "amount" || field.type === "stepper") && String(value).trim().length > 0) {
    const asNumber = Number(value);
    if (Number.isFinite(asNumber)) {
      return asNumber.toLocaleString(locale);
    }
  }
  return String(value ?? "");
}

export function SimulatorToolPage({
  title,
  description,
  apiPath,
  calculatorType,
  fields,
  breakdownLabels,
  units = {},
}: SimulatorToolPageProps) {
  const { t, locale, language } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const [values, setValues] = useState<ValuesState>(createInitialState(fields));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>();
  const [messageTone, setMessageTone] = useState<FormStatusTone>("info");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [historyEntries, setHistoryEntries] = useState<SimulationHistoryEntry[]>([]);
  const { config } = usePublicConfig();
  const toolPolicy = resolveToolPolicy(config.toolPolicies, calculatorType);
  const userAuthenticated = config.userAuthenticated;
  const visibleFields = getVisibleFields(fields, values);
  const completedFields = visibleFields.filter((field) => {
    const value = values[field.key];
    if (field.type === "checkbox") return true;
    if (field.type === "tags") return Array.isArray(value) && value.length > 0;
    return String(value ?? "").trim().length > 0;
  }).length;
  const completionRate = Math.round((completedFields / Math.max(visibleFields.length, 1)) * 100);
  const localizedTitle = localizeCalculatorTitle(calculatorType, title, language);
  const localizedDescription = localizeCalculatorDescription(calculatorType, description, language);
  const localizedBreakdownLabels = Object.fromEntries(
    Object.entries(breakdownLabels ?? {}).map(([key, value]) => [
      key,
      localizeBreakdownLabel(key, value, language),
    ]),
  );
  const toolUsable = canUseTool(toolPolicy, userAuthenticated);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const allEntries = parseHistoryEntries(window.localStorage.getItem(HISTORY_STORAGE_KEY));
    setHistoryEntries(allEntries.filter((entry) => entry.calculatorType === calculatorType).slice(0, 5));
  }, [calculatorType]);

  function updateHistoryEntries(entry: SimulationHistoryEntry) {
    if (typeof window === "undefined") return;
    const allEntries = parseHistoryEntries(window.localStorage.getItem(HISTORY_STORAGE_KEY));
    const deduped = [entry, ...allEntries.filter((item) => item.id !== entry.id)].slice(0, 40);
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(deduped));
    setHistoryEntries(deduped.filter((item) => item.calculatorType === calculatorType).slice(0, 5));
  }

  function resetForm() {
    setValues(createInitialState(fields));
    setFieldErrors({});
    setMessage(undefined);
    setMessageTone("info");
  }

  const relatedLabels =
    language === "ar"
      ? {
          toolsTitle: "خطوات مرتبطة",
          toolsDescription: "اكتشف الادوات الاكثر فائدة لفهم الاجر والحقوق.",
          modelsTitle: "نماذج مفيدة",
          modelsDescription: "افتح الرسائل والنماذج الجاهزة المرتبطة بنفس الحالة.",
          articlesTitle: "شروحات عملية",
          articlesDescription: "اقرأ الشرح المبسط قبل اتخاذ الخطوة التالية.",
          back: "الرجوع الى قسم الاجر",
        }
      : {
          toolsTitle: "Outils lies",
          toolsDescription: "Retrouvez les calculs les plus utiles pour comprendre votre situation.",
          modelsTitle: "Modeles utiles",
          modelsDescription: "Accedez aux lettres et modeles associes a la meme demarche.",
          articlesTitle: "Guides pratiques",
          articlesDescription: "Lisez les explications utiles avant de passer a l'action.",
          back: "Retour aux Simulateurs",
        };
  const uiText =
    language === "ar"
      ? {
          formTitle: "Ø§Ø¯Ø®Ù„ Ø§Ù„Ù…Ø¹Ø·ÙŠØ§Øª",
          checklistTitle: "Ù‚Ø¨Ù„ Ø§Ù„Ø­Ø³Ø§Ø¨",
          checklistLine1: "Ø±Ø§Ø¬Ø¹ Ø§Ù„ØªÙˆØ§Ø±ÙŠØ® ÙˆØ§Ù„ÙØªØ±Ø©",
          checklistLine2: "Ø§Ø¯Ø®Ù„ Ø¬Ù…ÙŠØ¹ Ø§Ù„Ù…Ø¨Ø§Ù„Øº Ø¨Ù†ÙØ³ Ø§Ù„Ø¹Ù…Ù„Ø©",
          checklistLine3: "Ø§Ù„Ø®ÙŠØ§Ø±Ø§Øª Ø§Ù„Ø§Ø¶Ø§ÙÙŠØ© Ù‚Ø¯ ØªØ¤Ø«Ø± Ø¹Ù„Ù‰ Ø§Ù„Ù†ØªÙŠØ¬Ø©",
          previewTitle: "Ù…Ø¹Ø§ÙŠÙ†Ø© Ø³Ø±ÙŠØ¹Ø©",
        }
      : {
          formTitle: "Saisie des Parametres",
          checklistTitle: "Verifier Avant Calcul",
          checklistLine1: "Confirmez les dates et la periode analysee",
          checklistLine2: "Utilisez la meme devise pour tous les montants",
          checklistLine3: "Revoyez les options actives avant execution",
          previewTitle: "Apercu Rapide",
        };
  const historyTitle = language === "ar" ? "Historique" : "Historique Recent";
  const historyEmpty = language === "ar" ? "Aucune donnee recente." : "Aucune simulation enregistree pour cet outil.";
  const historyHint = language === "ar" ? "Les executions recentes apparaitront ici." : "Vos derniers calculs apparaitront ici.";
  const resetLabel = language === "ar" ? "Reset" : "Reinitialiser";
  const relatedItems = [
    {
      title: t("nav.simulate"),
      description: t("common.simulateDesc"),
      href: "/simulateurs",
    },
    {
      title: t("nav.plan"),
      description: t("common.planifierDesc"),
      href: "/planifier",
    },
    {
      title: t("nav.tools"),
      description: t("common.toolsDesc"),
      href: "/outils",
    },
    {
      title: t("nav.documents"),
      description: t("common.documentsDesc"),
      href: "/documents",
    },
  ];
  const statusClassName =
    messageTone === "success"
      ? "status-success"
      : messageTone === "warning"
        ? "status-warning"
        : messageTone === "error"
          ? "status-error"
          : "status-info";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!toolUsable) {
      setMessageTone("warning");
      setMessage(
        toolPolicy?.visible === false
          ? t("simulator.accessHidden")
          : toolPolicy?.enabled === false
            ? t("simulator.accessDisabled")
            : t("simulator.accessLoggedOnly"),
      );
      return;
    }

    const visibleErrors = buildFieldErrors(visibleFields, values);
    if (Object.keys(visibleErrors).length > 0) {
      setFieldErrors(visibleErrors);
      setMessageTone("warning");
      setMessage(`Verification requise: ${Object.keys(visibleErrors).length} champ(s) a corriger.`);
      return;
    }

    setFieldErrors({});
    setLoading(true);
    setMessageTone("info");
    setMessage("Simulation en cours...");

    try {
      const payload = toPayload(values, fields);
      const response = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as {
        ok: boolean;
        result?: GenericSimulationResult;
      };
      if (!data.ok || !data.result) {
        throw new Error("simulation-failed");
      }

      writeSimulationResultSnapshot({
        calculatorPath: pathname,
        calculatorType,
        title: localizedTitle,
        description: localizedDescription,
        generatedAt: new Date().toISOString(),
        breakdownLabels: localizedBreakdownLabels,
        units,
        locale,
        inputPayload: payload,
        result: data.result,
      });

      trackEvent({
        type: "simulation_run",
        path: pathname,
        locale,
        meta: { calculatorType },
      });

      const metric = pickPrimaryMetric(data.result, localizedBreakdownLabels, units, locale);
      updateHistoryEntries({
        id: `${calculatorType}-${Date.now()}`,
        calculatorType,
        title: localizedTitle,
        generatedAt: new Date().toISOString(),
        primaryMetricLabel: metric.label,
        primaryMetricValue: metric.value,
      });

      let simulationId: string | undefined;
      try {
        const saveResponse = await fetch("/api/simulations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            calculatorType,
            input: payload,
            result: data.result,
          }),
        });
        if (saveResponse.ok) {
          const saveData = (await saveResponse.json()) as {
            ok?: boolean;
            item?: { id?: string };
          };
          if (saveData.ok && typeof saveData.item?.id === "string") {
            simulationId = saveData.item.id;
          }
        }
      } catch {
        // Saving history is best-effort; local snapshot still enables the result page.
      }

      const resultHref = simulationId
        ? `${pathname}/result?simulationId=${encodeURIComponent(simulationId)}`
        : `${pathname}/result`;
      router.push(resultHref);

      setMessageTone("success");
      setMessage(t("simulator.success"));
    } catch {
      setMessageTone("error");
      setMessage(t("simulator.failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="paper-bg min-h-screen max-w-full overflow-x-hidden">
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-10 pt-6 sm:px-6">
        <section className="soft-card rounded-[2rem] p-5 sm:p-7">
          <p className="section-kicker">{t("simulator.title")}</p>
          <h1 className="display-font mt-2 break-words text-3xl font-semibold sm:text-4xl">{localizedTitle}</h1>
          <p className="mt-2 break-words text-sm text-[var(--ink-soft)]">{localizedDescription}</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <article className="panel-strong rounded-xl p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">{t("simulator.parametersTitle")}</p>
              <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">{visibleFields.length}</p>
            </article>
            <article className="panel-strong rounded-xl p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">{t("simulator.completedFields", { count: completedFields, total: visibleFields.length })}</p>
              <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">{completedFields}</p>
            </article>
            <article className="panel-strong rounded-xl p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">{t("simulator.completionRate", { rate: completionRate })}</p>
              <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">{completionRate}%</p>
            </article>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[var(--accent)]">1. {t("simulator.stepInput")}</span>
            <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-[var(--ink-soft)]">2. {t("simulator.stepCompute")}</span>
            <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-[var(--ink-soft)]">3. {t("simulator.stepResult")}</span>
          </div>
          <Link href="/simulateurs" className="mt-3 inline-block text-sm font-semibold text-[var(--accent)]">
            {relatedLabels.back}
          </Link>
        </section>

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(290px,1fr)] lg:items-start">
          <form onSubmit={onSubmit} className="soft-card min-w-0 w-full rounded-3xl p-5 sm:p-7">
            <h2 className="display-font break-words text-xl font-semibold">{uiText.formTitle}</h2>
            <p className="mt-2 break-words text-sm font-medium text-[var(--ink-soft)]">
              {t("simulator.completionRate", { rate: completionRate })}
            </p>

            <div className="panel-strong mt-5 rounded-2xl p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                {uiText.checklistTitle}
              </p>
              <ul className="mt-2 space-y-1 text-sm text-[var(--ink-soft)]">
                <li>- {uiText.checklistLine1}</li>
                <li>- {uiText.checklistLine2}</li>
                <li>- {uiText.checklistLine3}</li>
              </ul>
            </div>

            {Object.keys(fieldErrors).length > 0 ? (
              <section className="status-warning mt-5 rounded-2xl px-4 py-3">
                <p className="text-sm font-semibold">Verification requise</p>
                <p className="mt-1 text-xs">
                  Corrigez les champs signales avant de lancer la simulation.
                </p>
              </section>
            ) : null}

            {loading ? (
              <section className="panel-tonal mt-5 rounded-2xl p-4">
                <p className="text-sm font-semibold text-[var(--foreground)]">{t("simulator.running")}</p>
                <div className="mt-3 space-y-2 animate-pulse">
                  <div className="h-2 rounded-full bg-[var(--surface-muted)]" />
                  <div className="h-2 w-5/6 rounded-full bg-[var(--surface-muted)]" />
                  <div className="h-2 w-3/4 rounded-full bg-[var(--surface-muted)]" />
                </div>
              </section>
            ) : null}

            <div className="mt-6 flex flex-col gap-8">
              {visibleFields.map((field) => (
                <div key={field.key} className="rounded-2xl bg-[var(--surface-elevated)] p-4">
                  <FieldRenderer
                    field={field}
                    language={language}
                    value={values[field.key]}
                    error={fieldErrors[field.key]}
                    onChange={(val) => {
                      setValues((prev) => ({ ...prev, [field.key]: val }));
                      setMessage(undefined);
                      setFieldErrors((prev) => {
                        if (!prev[field.key]) return prev;
                        const next = { ...prev };
                        delete next[field.key];
                        return next;
                      });
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="panel-tonal sticky bottom-[calc(0.5rem+env(safe-area-inset-bottom))] z-10 mt-8 grid grid-cols-2 gap-2 rounded-2xl p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] backdrop-blur">
              <Button
                type="submit"
                variant="primary"
                disabled={loading || !toolUsable}
                className="btn-primary h-12 w-full text-base font-semibold transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                {loading ? t("simulator.running") : t("simulator.run")}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                className="btn-muted h-12 w-full text-base"
                onClick={resetForm}
              >
                {resetLabel}
              </Button>
            </div>

            {!toolUsable ? (
              <p className="mt-4 text-center break-words text-xs text-[var(--ink-soft)]">
                {toolPolicy?.enabled === false
                  ? t("simulator.accessDisabled")
                  : toolPolicy?.visible === false
                    ? t("simulator.accessHidden")
                    : t("simulator.accessLoggedOnly")}
              </p>
            ) : null}

            <p className="mt-4 break-words text-center text-xs italic text-[var(--ink-soft)]">
              {t("simulator.quickCheck")}
            </p>
          </form>

          <aside className="min-w-0 space-y-4 lg:sticky lg:top-20">
            <section className="soft-card min-w-0 rounded-3xl p-5">
              <p className="section-kicker">{uiText.previewTitle}</p>
              <p className="mt-2 break-words text-sm text-[var(--ink-soft)]">
                {t("simulator.completedFields", { count: completedFields, total: visibleFields.length })}:{" "}
                <span className="font-semibold text-[var(--foreground)]">{completedFields}</span> / {visibleFields.length}
              </p>
              <div className="mt-3 h-2 rounded-full bg-[var(--surface-muted)]">
                <div
                  className="h-full rounded-full bg-[var(--accent)] transition-all"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
              <div className="panel-tonal mt-4 rounded-2xl p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                  {t("simulator.previewValuesTitle")}
                </p>
                <div className="mt-2 space-y-2 text-xs">
                  {visibleFields.slice(0, 5).map((field) => (
                    <div key={field.key} className="flex items-start justify-between gap-3">
                      <span className="min-w-0 flex-1 break-words text-[var(--ink-soft)]">
                        {localizeFieldLabel(field.key, field.label, language)}
                      </span>
                      <span className="min-w-0 max-w-[58%] break-words text-right font-semibold text-[var(--foreground)]">
                        {formatPreviewValue(values[field.key] ?? "", field, locale, t("common.yes"), t("common.no"))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="soft-card min-w-0 rounded-3xl p-5">
              <p className="section-kicker">{historyTitle}</p>
              {historyEntries.length === 0 ? (
                <div className="panel-tonal mt-3 rounded-2xl p-3">
                  <p className="text-sm text-[var(--foreground)]">{historyEmpty}</p>
                  <p className="mt-1 text-xs text-[var(--ink-soft)]">{historyHint}</p>
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  {historyEntries.map((entry) => (
                    <article key={entry.id} className="panel-strong rounded-xl p-3">
                      <p className="truncate text-sm font-semibold text-[var(--foreground)]">{entry.primaryMetricValue}</p>
                      <p className="truncate text-xs text-[var(--ink-soft)]">{entry.primaryMetricLabel}</p>
                      <p className="mt-1 text-[11px] text-[var(--ink-soft)]">
                        {new Date(entry.generatedAt).toLocaleString(locale)}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <PartnerAdSection slot="4444444444" className="mt-5">
              <p className="mt-2 break-words text-sm text-[var(--ink-soft)]">{t("simulator.partnerDisclaimer")}</p>
            </PartnerAdSection>
          </aside>
        </div>

        {message ? (
          <p className={`${statusClassName} mt-4 rounded-2xl px-3 py-2 text-sm`}>{message}</p>
        ) : null}

        <RelatedContent items={relatedItems} />
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: localizedTitle,
          description: localizedDescription,
          url: absoluteUrl(pathname),
          inLanguage: language === "ar" ? "ar-MA" : "fr-MA",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "MAD",
          },
          publisher: {
            "@type": "Organization",
            name: "MON RH",
          },
        }}
      />
    </main>
  );
}

function FieldRenderer({
  field,
  language,
  value,
  error,
  onChange,
}: {
  field: SimulatorField;
  language: "fr" | "ar";
  value: any;
  error?: string;
  onChange: (value: any) => void;
}) {
  const label = localizeFieldLabel(field.key, field.label, language);

  // Heuristics for smarter component selection if types are generic
  let effectiveType = field.type;
  if (effectiveType === "number") {
    if (field.key.toLowerCase().includes("salaire") || 
        field.key.toLowerCase().includes("montant") || 
        field.key.toLowerCase().includes("brut") ||
        field.key.toLowerCase().includes("indemnite") ||
        field.key.toLowerCase().includes("plafond")) {
      effectiveType = "amount";
    } else if (field.key.toLowerCase().includes("anciennete") || 
               field.key.toLowerCase().includes("mois") || 
               field.key.toLowerCase().includes("jours") ||
               field.key.toLowerCase().includes("enfants")) {
      effectiveType = "stepper";
    }
  }

  switch (effectiveType) {
    case "date":
      return (
        <SmartDate
          label={label}
          value={String(value || "")}
          onChange={onChange}
          error={error}
          required
        />
      );

    case "amount":
      return (
        <SmartAmount
          label={label}
          value={String(value || "")}
          onChange={onChange}
          error={error}
          required
          hint={field.key.toLowerCase().includes("salaire") ? "SMIG 2025: 4 000 DH" : undefined}
        />
      );

    case "checkbox":
      // Infer subtitle for Moroccan context if not provided
      let subtitle = field.subtitle;
      if (!subtitle) {
        if (field.key === "publicSector") subtitle = "RCAR, 40h, 30 jours congé";
        if (field.key === "cadre") subtitle = "Régime cadre (CIMR, préavis étendu)";
      }
      return (
        <SmartToggle
          label={label}
          value={Boolean(value)}
          onChange={onChange}
          subtitle={subtitle}
          error={error}
        />
      );

    case "stepper":
      return (
        <div className="sim-input-container">
          <SmartStepper
            label={label}
            value={Number(value || 0)}
            onChange={onChange}
            min={field.min ?? 0}
            max={field.max ?? 100}
          />
          {error ? <p className="sim-hint sim-error-text">{error}</p> : null}
        </div>
      );

    case "select":
      if (field.options && field.options.length <= 4) {
        return (
          <div className="sim-input-container">
            <SmartRadioCards
              label={label}
              value={String(value || "")}
              onChange={onChange}
              options={field.options.map(opt => ({
                ...opt,
                label: localizeOptionLabel(opt.value, opt.label, language)
              }))}
            />
            {error ? <p className="sim-hint sim-error-text">{error}</p> : null}
          </div>
        );
      }
      return (
        <div className="sim-input-container">
          <SmartLookup
            label={label}
            value={String(value || "")}
            onChange={onChange}
            options={field.options?.map(opt => ({
              ...opt,
              label: localizeOptionLabel(opt.value, opt.label, language)
            })) || []}
            required
          />
          {error ? <p className="sim-hint sim-error-text">{error}</p> : null}
        </div>
      );

    case "tags":
      return (
        <SmartTagInput
          label={label}
          value={Array.isArray(value) ? value : []}
          onChange={onChange}
        />
      );

    case "text":
      return (
        <div className="sim-input-container">
          <label className="sim-label sim-field-required">{label}</label>
          <div className="sim-input-wrapper">
            <input
              type="text"
              value={String(value || "")}
              onChange={(e) => onChange(e.target.value)}
              className={`sim-input ${error ? "sim-input-error" : ""}`}
              required
              placeholder={label}
            />
          </div>
          {error ? <p className="sim-hint sim-error-text">{error}</p> : null}
        </div>
      );

    default:
      return (
        <div className="sim-input-container">
          <label className="sim-label sim-field-required">{label}</label>
          <div className="sim-input-wrapper">
            <input
              type={effectiveType}
              value={String(value || "")}
              onChange={(e) => onChange(e.target.value)}
              className={`sim-input ${error ? "sim-input-error" : ""}`}
              required
              placeholder={label}
            />
          </div>
          {error ? <p className="sim-hint sim-error-text">{error}</p> : null}
        </div>
      );
  }
}
