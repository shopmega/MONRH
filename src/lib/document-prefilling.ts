import type { UserJourneyContext } from "@/lib/context/user-journey-context";
import type { SimulationResultSnapshot } from "@/lib/simulations/result-snapshot";
import { buildDocumentHref, buildSimulationResultDocumentLink } from "@/lib/tools/result-document-links";

export interface PrefillData {
  [key: string]: string | number | boolean;
}

function buildCommonContextPrefill(context: UserJourneyContext): PrefillData {
  const data: PrefillData = {};

  if (context.personal.firstName) {
    data.employee_name = `${context.personal.firstName} ${context.personal.lastName || ""}`.trim();
  }

  if (context.employment.companyName) {
    data.company_name = context.employment.companyName;
  }

  if (context.employment.position) {
    data.position = context.employment.position;
  }

  return data;
}

function extractHrefPrefillData(href: string): PrefillData {
  const [, query = ""] = href.split("?");
  const params = new URLSearchParams(query);
  const data: PrefillData = {};

  for (const [key, value] of params.entries()) {
    data[key] = value;
  }

  return data;
}

function buildResolvedPrefill(
  simulation: SimulationResultSnapshot,
  context: UserJourneyContext,
): { documentId: string; data: PrefillData } | null {
  const link = buildSimulationResultDocumentLink(simulation);
  if (!link) {
    return null;
  }

  return {
    documentId: link.templateId,
    data: {
      ...buildCommonContextPrefill(context),
      ...extractHrefPrefillData(link.href),
    },
  };
}

function getPriority(simulation: SimulationResultSnapshot): number {
  if (simulation.calculatorType === "licenciement") return 1;
  if (
    simulation.calculatorType === "unpaid_salary_recovery" ||
    simulation.calculatorType === "unpaid_overtime_recovery" ||
    simulation.calculatorType === "harassment_scenario"
  ) {
    return 1;
  }

  if (
    simulation.calculatorType === "demission" ||
    simulation.calculatorType === "duree_preavis" ||
    simulation.calculatorType === "work_accident"
  ) {
    return 2;
  }

  return 3;
}

export function generatePrefillData(
  simulation: SimulationResultSnapshot,
  context: UserJourneyContext,
): PrefillData {
  return buildResolvedPrefill(simulation, context)?.data ?? buildCommonContextPrefill(context);
}

export function generatePrefillUrl(
  documentId: string,
  prefilledData: PrefillData,
): string {
  return buildDocumentHref(documentId, prefilledData);
}

export function getDocumentSuggestions(
  simulation: SimulationResultSnapshot,
  context: UserJourneyContext,
): Array<{ id: string; title: string; description: string; priority: number }> {
  const link = buildResolvedPrefill(simulation, context);
  const docLink = buildSimulationResultDocumentLink(simulation);
  if (!link || !docLink) {
    return [];
  }

  return [
    {
      id: link.documentId,
      title: docLink.title,
      description: docLink.description,
      priority: getPriority(simulation),
    },
  ];
}

export function getPrefillDataForDocument(
  documentId: string,
  simulation: SimulationResultSnapshot,
  context: UserJourneyContext,
): PrefillData {
  const resolved = buildResolvedPrefill(simulation, context);
  if (!resolved || resolved.documentId !== documentId) {
    return {};
  }

  return resolved.data;
}
