'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useLanguage } from '@/components/language-provider';
import { useUserJourney } from '@/lib/context/user-journey-context';
import { detectUserScenario, getRecommendedDocuments, getNextSteps } from '@/lib/context/scenario-detection';
import { addSimulationToJourney } from '@/lib/context/user-journey-context';
import { Button } from '@/components/ui/button';
import { writeSimulationResultSnapshot } from '@/lib/simulations/result-snapshot';
import { 
  SmartDate, 
  SmartAmount, 
  SmartToggle, 
  SmartRadioCards, 
  SmartStepper,
  SmartLookup,
  SmartTagInput
} from '@/components/ui/smart-inputs';

interface Field {
  key: string;
  label: string;
  type: 'number' | 'date' | 'checkbox' | 'select' | 'text' | 'amount' | 'stepper' | 'tags' | 'lookup';
  defaultValue?: string | number | boolean | string[];
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{ value: string; label: string; description?: string; icon?: React.ReactNode }>;
  subtitle?: string;
  visibleIf?: (values: Record<string, unknown>) => boolean;
}

const CALCULATION_DATE_KEY = "calculationDate";
type SearchParamsLike = Pick<URLSearchParams, "get">;

function getCurrentDateISO() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function emptyValueForField(field: Field) {
  if (field.defaultValue !== undefined) return field.defaultValue;
  if (field.type === "checkbox") return false;
  if (field.type === "tags") return [];
  return "";
}

function parseFieldValue(field: Field, value: string) {
  if (field.type === "number" || field.type === "amount" || field.type === "stepper") return value;
  if (field.type === "checkbox") return value === "true";
  if (field.type === "tags") return value.split(",").map((item) => item.trim()).filter(Boolean);
  return value;
}

function isSameValue(left: unknown, right: unknown) {
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left) && Array.isArray(right) && left.join("\u0000") === right.join("\u0000");
  }
  return left === right;
}

function createInitialValues(fields: Field[], searchParams: SearchParamsLike) {
  const initialValues: Record<string, unknown> = {};
  fields.forEach((field) => {
    const paramValue = searchParams.get(field.key);
    initialValues[field.key] = paramValue !== null ? parseFieldValue(field, paramValue) : emptyValueForField(field);
  });
  return initialValues;
}

function withCalculationDate(values: Record<string, unknown>) {
  return {
    ...values,
    [CALCULATION_DATE_KEY]: String(values[CALCULATION_DATE_KEY] || getCurrentDateISO()),
  };
}

function toPayload(values: Record<string, unknown>, fields: Field[]) {
  const payload: Record<string, unknown> = {
    [CALCULATION_DATE_KEY]: String(values[CALCULATION_DATE_KEY] || getCurrentDateISO()),
  };
  for (const field of fields) {
    if (field.key === CALCULATION_DATE_KEY) continue;
    const value = values[field.key];
    if (value === "" || value === undefined || value === null) continue;
    if (field.type === "checkbox") {
      payload[field.key] = Boolean(value);
    } else if (field.type === "number" || field.type === "amount" || field.type === "stepper") {
      payload[field.key] = Number(value);
    } else {
      payload[field.key] = value;
    }
  }
  return payload;
}

function toSearchParams(values: Record<string, unknown>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, Array.isArray(value) ? value.join(",") : String(value));
  }
  return params;
}

// Simple field renderer based on the existing pattern
function SimpleFieldRenderer({ 
  field, 
  value, 
  onChange 
}: { 
  field: Field; 
  value: unknown; 
  onChange: (value: unknown) => void;
}) {
  const fieldId = `sim-${field.key}`;
  // Heuristics for smarter component selection
  let effectiveType = field.type;
  if (effectiveType === 'number') {
    if (field.key.toLowerCase().includes('salaire') || 
        field.key.toLowerCase().includes('montant') || 
        field.key.toLowerCase().includes('brut') ||
        field.key.toLowerCase().includes('indemnite') ||
        field.key.toLowerCase().includes('plafond')) {
      effectiveType = 'amount';
    }
  }

  switch (effectiveType) {
    case 'date':
      return (
        <SmartDate
          id={fieldId}
          name={field.key}
          label={field.label}
          value={String(value || '')}
          onChange={onChange}
          required
        />
      );

    case 'amount':
      return (
        <SmartAmount
          id={fieldId}
          name={field.key}
          label={field.label}
          value={String(value || '')}
          onChange={onChange}
          required
          hint={field.key.toLowerCase().includes('salaire') ? "SMIG 2025: 4 000 DH" : undefined}
        />
      );

    case 'checkbox':
      let subtitle = field.subtitle;
      if (!subtitle) {
        if (field.key === 'publicSector') subtitle = "RCAR, 40h, 30 jours congé";
        if (field.key === 'cadre') subtitle = "Régime cadre (CIMR, préavis étendu)";
      }
      return (
        <SmartToggle
          id={fieldId}
          name={field.key}
          label={field.label}
          value={Boolean(value)}
          onChange={onChange}
          subtitle={subtitle}
        />
      );

    case 'stepper':
      return (
        <SmartStepper
          id={fieldId}
          name={field.key}
          label={field.label}
          value={Number(value || 0)}
          onChange={onChange}
          min={field.min ?? 0}
          max={field.max ?? 100}
        />
      );

    case 'select':
      if (field.options && field.options.length <= 4) {
        return (
          <SmartRadioCards
            id={fieldId}
            name={field.key}
            label={field.label}
            value={String(value || '')}
            onChange={onChange}
            options={field.options}
          />
        );
      }
      return (
        <SmartLookup
          id={fieldId}
          name={field.key}
          label={field.label}
          value={String(value || '')}
          onChange={onChange}
          options={field.options || []}
          required
        />
      );

    case 'tags':
      return (
        <SmartTagInput
          id={fieldId}
          name={field.key}
          label={field.label}
          value={Array.isArray(value) ? value : []}
          onChange={onChange}
        />
      );

    case 'text':
      return (
        <div className="sim-input-container">
          <label htmlFor={fieldId} className="sim-label sim-field-required">{field.label}</label>
          <div className="sim-input-wrapper">
            <input
              id={fieldId}
              name={field.key}
              type="text"
              value={String(value || '')}
              onChange={(e) => onChange(e.target.value)}
              className="sim-input"
              required
              placeholder={field.label}
            />
          </div>
        </div>
      );

    default:
      return (
        <div className="sim-input-container">
          <label htmlFor={fieldId} className="sim-label sim-field-required">{field.label}</label>
          <div className="sim-input-wrapper">
            <input
              id={fieldId}
              name={field.key}
              type={effectiveType as React.HTMLInputTypeAttribute}
              value={String(value || '')}
              onChange={(e) => onChange(e.target.value)}
              className="sim-input"
              required
              placeholder={field.label}
            />
          </div>
        </div>
      );
  }
}

interface EnhancedSimulatorToolPageProps {
  title: string;
  description: string;
  apiPath: string;
  calculatorType: string;
  fields: Field[];
  breakdownLabels?: Record<string, string>;
  units?: Record<string, string>;
}

export function EnhancedSimulatorToolPage(props: EnhancedSimulatorToolPageProps) {
  return (
    <Suspense fallback={null}>
      <EnhancedSimulatorToolPageContent {...props} />
    </Suspense>
  );
}

function EnhancedSimulatorToolPageContent({
  title,
  description,
  apiPath,
  calculatorType,
  fields,
  breakdownLabels = {},
  units = {},
}: EnhancedSimulatorToolPageProps) {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { context, updateLegalContext, addJourneyEvent } = useUserJourney();
  
  const [values, setValues] = useState<Record<string, unknown>>(() => createInitialValues(fields, searchParams));
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Load pre-filled values from URL params
  useEffect(() => {
    const prefilled: Record<string, unknown> = {};
    fields.forEach(field => {
      const paramValue = searchParams.get(field.key);
      if (paramValue !== null) {
        prefilled[field.key] = parseFieldValue(field, paramValue);
      }
    });
    
    if (Object.keys(prefilled).length > 0) {
      setValues(prev => {
        const next = { ...prev };
        let changed = false;
        for (const [key, value] of Object.entries(prefilled)) {
          if (!isSameValue(next[key], value)) {
            next[key] = value;
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }
  }, [searchParams, fields]);

  // Detect scenario and update context
  useEffect(() => {
    if (context.journey.length > 0) {
      const lastSimulations = context.journey.filter(event => event.type === 'simulation');
      const currentSimulation = { type: calculatorType, result: values };
      
      const scenario = detectUserScenario(lastSimulations, currentSimulation);
      updateLegalContext({
        currentScenario: scenario.type === 'salary_dispute' ? 'dispute' :
                       scenario.type === 'termination_preparation' ? 'termination' :
                       scenario.type === 'workplace_dispute' ? 'dispute' :
                       scenario.type === 'financial_planning' ? 'planning' :
                       'information',
        urgencyLevel: scenario.urgencyLevel,
      });
      
      setSuggestions(getRecommendedDocuments(scenario));
    }
  }, [calculatorType, context.journey, updateLegalContext, values]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      addJourneyEvent({
        type: 'navigation',
        data: {
          calculatorType,
          input: withCalculationDate(values),
        },
        context: 'simulation_started'
      });

      const payload = toPayload(values, fields);

      const response = await fetch(apiPath, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const simulationResult = await response.json();

      const rawResult =
        simulationResult && typeof simulationResult === "object" && "result" in simulationResult
          ? (simulationResult as { result: Record<string, unknown> }).result
          : (simulationResult as Record<string, unknown>);
      const rawBreakdownSource =
        rawResult?.breakdown && typeof rawResult.breakdown === "object" && !Array.isArray(rawResult.breakdown)
          ? (rawResult.breakdown as Record<string, unknown>)
          : {};
      const breakdownSource = Object.fromEntries(
        Object.entries(rawBreakdownSource).filter(([, value]) => {
          const type = typeof value;
          return type === "string" || type === "number" || type === "boolean";
        }),
      ) as Record<string, string | number | boolean>;
      const fallbackLabels = Object.fromEntries(Object.keys(breakdownSource).map((key) => [key, key]));

      writeSimulationResultSnapshot({
        calculatorPath: window.location.pathname,
        calculatorType,
        title,
        description,
        generatedAt: new Date().toISOString(),
        breakdownLabels: Object.keys(breakdownLabels).length > 0 ? breakdownLabels : fallbackLabels,
        units,
        locale,
        inputPayload: payload,
        result: {
          versionCode:
            typeof rawResult?.versionCode === "string" && rawResult.versionCode.trim().length > 0
              ? rawResult.versionCode
              : "ma_2026",
          breakdown: breakdownSource,
          explanation:
            rawResult?.explanation && typeof rawResult.explanation === "object"
              ? (rawResult.explanation as {
                  summary: string;
                  assumptions: string[];
                  formulas: string[];
                  warnings: string[];
                  nextSteps: string[];
                })
              : undefined,
        },
      });

      addSimulationToJourney(calculatorType, simulationResult, payload);

      let simulationId: string | undefined;
      try {
        const saveResponse = await fetch("/api/simulations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            calculatorType,
            input: payload,
            result: {
              versionCode:
                typeof rawResult?.versionCode === "string" && rawResult.versionCode.trim().length > 0
                  ? rawResult.versionCode
                  : "ma_2026",
              breakdown: breakdownSource,
              explanation:
                rawResult?.explanation && typeof rawResult.explanation === "object"
                  ? rawResult.explanation
                  : undefined,
            },
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
        // Server-side save is optional for anonymous users.
      }

      const resultHref = simulationId
        ? `${window.location.pathname}/result?simulationId=${encodeURIComponent(simulationId)}`
        : `${window.location.pathname}/result`;
      router.push(resultHref);
      
    } catch (err) {
      console.error('Simulation error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleValueChange = (key: string, value: unknown) => {
    setValues(prev => ({ ...prev, [key]: value }));
    
    addJourneyEvent({
      type: 'navigation',
      data: {
        field: key,
        value,
        calculatorType,
      },
      context: 'field_updated'
    });
  };

  const handleDocumentSuggestion = (documentId: string) => {
    router.push(`/documents/${documentId}?${toSearchParams(values).toString()}`);
  };

  const getScenarioColor = (scenario: string) => {
    switch (scenario) {
      case 'dispute': return 'bg-[var(--warning-soft)] border-[var(--warning-line)] text-[var(--foreground)]';
      case 'termination': return 'bg-[var(--accent-soft)] border-[var(--line)] text-[var(--foreground)]';
      case 'planning': return 'bg-[var(--surface-muted)] border-[var(--line)] text-[var(--foreground)]';
      default: return 'bg-[var(--surface-muted)] border-[var(--line)] text-[var(--ink-soft)]';
    }
  };

  return (
    <main className="paper-bg min-h-screen max-w-full overflow-x-hidden">
      <div className="relative z-10 mx-auto w-full max-w-5xl min-w-0 px-4 pb-10 pt-6 sm:px-6">
        <section className="soft-card rounded-[2rem] p-5 sm:p-7">
          <p className="section-kicker">{t("simulator.title")}</p>
          <h1 className="display-font mt-2 break-words text-3xl font-semibold sm:text-4xl">{title}</h1>
          <p className="mt-2 break-words text-sm text-[var(--ink-soft)]">{description}</p>

          {context.legal.currentScenario && context.legal.currentScenario !== 'information' && (
            <div className={`mt-4 rounded-2xl border p-4 ${getScenarioColor(context.legal.currentScenario)}`}>
              <p className="font-semibold">
                {t(`simulator.scenario.${context.legal.currentScenario}`)}
              </p>
              {context.legal.urgencyLevel && (
                <p className="mt-1 text-sm font-medium">
                  Urgency: {context.legal.urgencyLevel}
                </p>
              )}
            </div>
          )}
        </section>

        <section className="soft-card mt-4 rounded-3xl p-5 sm:p-7">
          <h2 className="display-font text-xl font-semibold">Parameters</h2>
          <form onSubmit={handleSubmit} className="mt-5 space-y-6">
            {fields.map((field) => {
              if (field.key === CALCULATION_DATE_KEY) return null;
              const isVisible = field.visibleIf ? field.visibleIf(values) : true;
              return (
                <div
                  key={field.key}
                  className={`conditional-container rounded-2xl ${isVisible ? "conditional-visible panel-tonal p-4" : "conditional-hidden"}`}
                >
                  <div className="space-y-2">
                    <SimpleFieldRenderer
                      field={field}
                      value={values[field.key]}
                      onChange={(value) => handleValueChange(field.key, value)}
                    />
                  </div>
                </div>
              );
            })}

            {error && (
              <div className="status-error rounded-xl p-3">
                <p className="text-sm">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
              className="btn-primary h-11 w-full text-sm font-semibold"
            >
              {isLoading ? 'Calculating...' : 'Calculate'}
            </Button>
          </form>
        </section>

        {suggestions.length > 0 && (
          <section className="soft-card mt-4 rounded-3xl p-5">
            <h2 className="display-font text-xl font-semibold">Recommended Documents</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {suggestions.map((documentId) => (
                <div key={documentId} className="panel-tonal flex items-center justify-between gap-3 rounded-2xl p-4">
                  <div className="min-w-0">
                    <h4 className="truncate font-semibold">{documentId}</h4>
                    <p className="mt-1 text-sm text-[var(--ink-soft)]">
                      Generate this document based on your calculation
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => handleDocumentSuggestion(documentId)}
                  >
                    Open
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )}

        {context.legal.currentScenario && context.legal.currentScenario !== 'information' && (
          <section className="soft-card mt-4 rounded-3xl p-5">
            <h2 className="display-font text-xl font-semibold">Next Steps</h2>
            <ol className="mt-4 space-y-2">
              {getNextSteps({
                type: context.legal.currentScenario === 'dispute' ? 'salary_dispute' :
                       context.legal.currentScenario === 'termination' ? 'termination_preparation' :
                       context.legal.currentScenario === 'planning' ? 'financial_planning' :
                       'information',
                confidence: 0.8,
                indicators: [],
                recommendedActions: [],
                urgencyLevel: context.legal.urgencyLevel || 'low'
              }).map((step, index) => (
                <li key={index} className="panel-tonal flex items-start gap-3 rounded-2xl px-3 py-2.5">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-semibold text-[var(--juris-on-primary)]">
                    {index + 1}
                  </span>
                  <span className="text-sm">{step}</span>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    </main>
  );
}
