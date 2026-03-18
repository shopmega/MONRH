"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { AdSlot } from "@/components/ad-slot";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

type FieldType = "number" | "date" | "checkbox" | "select";

type FieldOption = {
  label: string;
  value: string;
};

export type SimulatorField = {
  key: string;
  label: string;
  type: FieldType;
  defaultValue: string | boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: FieldOption[];
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

type ValuesState = Record<string, string | boolean>;

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

function formatPreviewValue(
  value: string | boolean,
  field: SimulatorField,
  locale: string,
  yesLabel: string,
  noLabel: string,
) {
  if (field.type === "checkbox") {
    return value ? yesLabel : noLabel;
  }
  if (field.type === "number" && String(value).trim().length > 0) {
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
  const { config } = usePublicConfig();
  const toolPolicy = resolveToolPolicy(config.toolPolicies, calculatorType);
  const userAuthenticated = config.userAuthenticated;
  const completedFields = fields.filter((field) => {
    const value = values[field.key];
    if (field.type === "checkbox") return true;
    return String(value ?? "").trim().length > 0;
  }).length;
  const completionRate = Math.round((completedFields / Math.max(fields.length, 1)) * 100);
  const localizedTitle = localizeCalculatorTitle(calculatorType, title, language);
  const localizedDescription = localizeCalculatorDescription(calculatorType, description, language);
  const localizedBreakdownLabels = Object.fromEntries(
    Object.entries(breakdownLabels).map(([key, value]) => [
      key,
      localizeBreakdownLabel(key, value, language),
    ]),
  );
  const toolUsable = canUseTool(toolPolicy, userAuthenticated);
  const relatedItems = [
    {
      title: t("simulator.relatedSimulatorsTitle"),
      description: t("simulator.relatedSimulatorsDesc"),
      href: "/simulateurs",
    },
    {
      title: t("simulator.relatedDocumentsTitle"),
      description: t("simulator.relatedDocumentsDesc"),
      href: "/documents",
    },
    {
      title: t("simulator.relatedLibraryTitle"),
      description: t("simulator.relatedLibraryDesc"),
      href: "/bibliotheque",
    },
  ];

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!toolUsable) {
      setMessage(
        toolPolicy?.visible === false
          ? t("simulator.accessHidden")
          : toolPolicy?.enabled === false
            ? t("simulator.accessDisabled")
            : t("simulator.accessLoggedOnly"),
      );
      return;
    }
    setLoading(true);
    setMessage(undefined);

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

      router.push(`${pathname}/result`);

      await fetch("/api/simulations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calculatorType,
          input: payload,
          result: data.result,
        }),
      });

      setMessage(t("simulator.success"));
    } catch {
      setMessage(t("simulator.failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="paper-bg min-h-screen">
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-10 pt-6 sm:px-6">
        <section className="soft-card rounded-[2rem] p-5 sm:p-7">
          <p className="section-kicker">{t("simulator.title")}</p>
          <h1 className="display-font mt-2 break-words text-3xl font-semibold sm:text-4xl">{localizedTitle}</h1>
          <p className="mt-2 break-words text-sm text-[var(--ink-soft)]">{localizedDescription}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[var(--accent)]">1. {t("simulator.stepInput")}</span>
            <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-[var(--ink-soft)]">2. {t("simulator.stepCompute")}</span>
            <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-[var(--ink-soft)]">3. {t("simulator.stepResult")}</span>
          </div>
          <Link href="/simulateurs" className="mt-3 inline-block text-sm font-semibold text-[var(--accent)]">
            {t("common.backSimulators")}
          </Link>
        </section>

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(290px,1fr)] lg:items-start">
          <form onSubmit={onSubmit} className="soft-card min-w-0 rounded-3xl p-5 sm:p-7">
            <h2 className="display-font break-words text-xl font-semibold">
              {t("simulator.parametersTitle")}
            </h2>
            <p className="mt-2 break-words text-sm text-[var(--ink-soft)] font-medium">
              {t("simulator.completionRate", { rate: completionRate })}
            </p>

            <div className="mt-6 flex flex-col gap-6">
              {fields.map((field) => (
                <FieldRenderer
                  key={field.key}
                  field={field}
                  language={language}
                  value={values[field.key]}
                  onChange={(val) => {
                    setValues((prev) => ({ ...prev, [field.key]: val }));
                    setMessage(undefined);
                  }}
                />
              ))}
            </div>

            <Button
              type="submit"
              disabled={loading || !toolUsable}
              className="mt-8 w-full h-12 text-base font-semibold transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              {loading ? t("simulator.running") : t("simulator.run")}
            </Button>
            
            {!toolUsable ? (
              <p className="mt-4 text-center break-words text-xs text-[var(--ink-soft)]">
                {toolPolicy?.enabled === false
                  ? t("simulator.accessDisabled")
                  : toolPolicy?.visible === false
                    ? t("simulator.accessHidden")
                    : t("simulator.accessLoggedOnly")}
              </p>
            ) : null}

            <p className="mt-4 break-words text-xs text-[var(--ink-soft)] text-center italic">
              {t("simulator.quickCheck")}
            </p>
          </form>

          <aside className="space-y-4 lg:sticky lg:top-20">
            <section className="soft-card min-w-0 rounded-3xl p-5">
              <p className="section-kicker">{t("simulator.previewTitle")}</p>
              <p className="mt-2 break-words text-sm text-[var(--ink-soft)]">
                {t("simulator.completedFields", { count: completedFields, total: fields.length })}: <span className="font-semibold text-[var(--foreground)]">{completedFields}</span> / {fields.length}
              </p>
              <div className="mt-3 h-2 rounded-full bg-[var(--surface-muted)]">
                <div
                  className="h-full rounded-full bg-[var(--accent)] transition-all"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
              <div className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--surface-muted)] p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                  {t("simulator.previewValuesTitle")}
                </p>
                <div className="mt-2 space-y-2 text-xs">
                  {fields.slice(0, 5).map((field) => (
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
              <p className="section-kicker">{t("common.partner")}</p>
              <p className="mt-2 break-words text-sm text-[var(--ink-soft)]">
                {t("simulator.partnerDisclaimer")}
              </p>
              <div className="mt-4">
                <AdSlot slot="4444444444" format="auto" />
              </div>
            </section>
          </aside>
        </div>

        {message ? (
          <p className="status-success mt-4 rounded-2xl px-3 py-2 text-sm">{message}</p>
        ) : null}

        <RelatedContent items={relatedItems} />
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: localizedTitle,
          description: localizedDescription,
          applicationCategory: "BusinessApplication",
        }}
      />
    </main>
  );
}

function FieldRenderer({
  field,
  language,
  value,
  onChange,
}: {
  field: SimulatorField;
  language: "fr" | "ar";
  value: string | boolean | undefined;
  onChange: (value: string | boolean) => void;
}) {
  if (field.type === "checkbox") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-elevated)] p-4 transition-colors hover:border-[var(--accent)]">
        <input
          id={`field-${field.key}`}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => onChange(event.target.checked)}
          className="h-5 w-5 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
        />
        <Label 
          htmlFor={`field-${field.key}`} 
          className="cursor-pointer font-semibold text-[var(--foreground)] mt-0"
        >
          {localizeFieldLabel(field.key, field.label, language)}
        </Label>
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <div className="space-y-3">
        <Label htmlFor={`field-${field.key}`} className="font-semibold text-[var(--foreground)]">
          {localizeFieldLabel(field.key, field.label, language)}
        </Label>
        <Select
          id={`field-${field.key}`}
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
          required
        >
          {field.options?.map((item) => (
            <option key={item.value} value={item.value}>
              {localizeOptionLabel(item.value, item.label, language)}
            </option>
          ))}
        </Select>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Label htmlFor={`field-${field.key}`} className="font-semibold text-[var(--foreground)]">
        {localizeFieldLabel(field.key, field.label, language)}
      </Label>
      <Input
        id={`field-${field.key}`}
        type={field.type}
        min={field.min}
        max={field.max}
        step={field.step}
        value={String(value ?? "")}
        onChange={(event) => onChange(event.target.value)}
        required
        placeholder={localizeFieldLabel(field.key, field.label, language)}
      />
    </div>
  );
}
