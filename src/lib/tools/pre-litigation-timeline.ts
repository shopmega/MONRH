import { z } from "zod";

export const preLitigationTimelineInputSchema = z.object({
  incidentDate: z.string().date(),
  scenario: z.enum([
    "salary_delay",
    "unpaid_salary",
    "unpaid_overtime",
    "abusive_dismissal",
    "harassment",
  ]),
  internalResolutionAttempted: z.boolean().default(false),
  evidenceReady: z.boolean().default(false),
  urgentFinancialPressure: z.boolean().default(false),
});

export type PreLitigationTimelineInput = z.infer<typeof preLitigationTimelineInputSchema>;

export type PreLitigationTimelineResult = {
  riskScore: number;
  level: "low" | "medium" | "high";
  steps: Array<{
    code: string;
    title: string;
    description: string;
    dueDate: string;
    documentTemplateId?: string;
    documentHref?: string;
  }>;
};

function addDays(baseDate: string, days: number) {
  const d = new Date(baseDate);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function createScenarioDocumentLink(
  scenario: PreLitigationTimelineInput["scenario"],
  templateId: string,
): string {
  const params = new URLSearchParams();
  if (scenario === "salary_delay") {
    params.set("issue_summary", "Retard de salaire constate.");
  } else if (scenario === "unpaid_salary") {
    params.set("issue_summary", "Salaires impayes constates.");
  } else if (scenario === "unpaid_overtime") {
    params.set("issue_summary", "Heures supplementaires non reglees.");
  } else if (scenario === "abusive_dismissal") {
    params.set("issue_summary", "Contestations sur la rupture du contrat.");
  } else if (scenario === "harassment") {
    params.set("issue_summary", "Signalement de harcelement au travail.");
  }
  return `/documents/${templateId}?${params.toString()}`;
}

function scenarioTemplateIds(scenario: PreLitigationTimelineInput["scenario"]) {
  if (scenario === "unpaid_overtime") {
    return {
      internal: "overtime-claim-letter",
      inspector: "labor-inspector-complaint",
    };
  }
  if (scenario === "harassment") {
    return {
      internal: "harassment-report-letter",
      inspector: "labor-inspector-complaint",
    };
  }
  if (scenario === "abusive_dismissal") {
    return {
      internal: "formal-complaint-employer",
      inspector: "labor-inspector-complaint",
    };
  }
  if (scenario === "salary_delay" || scenario === "unpaid_salary") {
    return {
      internal: "salary-recovery-letter",
      inspector: "labor-inspector-complaint",
    };
  }
  return {
    internal: "formal-complaint-employer",
    inspector: "labor-inspector-complaint",
  };
}

export function buildPreLitigationTimeline(
  rawInput: PreLitigationTimelineInput,
  nowISO = new Date().toISOString().slice(0, 10),
): PreLitigationTimelineResult {
  const input = preLitigationTimelineInputSchema.parse(rawInput);
  const docs = scenarioTemplateIds(input.scenario);

  const daysMultiplier = input.urgentFinancialPressure ? 0.6 : 1;
  const dayOffset = (days: number) => Math.max(1, Math.round(days * daysMultiplier));

  const steps: PreLitigationTimelineResult["steps"] = [];

  if (!input.evidenceReady) {
    steps.push({
      code: "collect_evidence",
      title: "Constituer le dossier de preuves",
      description: "Rassembler contrats, bulletins, echanges et preuves horaires.",
      dueDate: addDays(input.incidentDate, dayOffset(2)),
    });
  }

  if (!input.internalResolutionAttempted) {
    steps.push({
      code: "internal_notice",
      title: "Envoyer une reclamation interne",
      description: "Notifier formellement l'employeur et demander une regularisation.",
      dueDate: addDays(input.incidentDate, dayOffset(4)),
      documentTemplateId: docs.internal,
      documentHref: createScenarioDocumentLink(input.scenario, docs.internal),
    });
  }

  steps.push({
    code: "follow_up",
    title: "Relance ecrite et mise en demeure",
    description: "Faire une relance ecrite si aucune reponse exploitable n'est recue.",
    dueDate: addDays(input.incidentDate, dayOffset(8)),
    documentTemplateId: "formal-complaint-employer",
    documentHref: createScenarioDocumentLink(input.scenario, "formal-complaint-employer"),
  });

  steps.push({
    code: "labor_inspector",
    title: "Preparation saisine inspection du travail",
    description: "Preparer le depot avec pieces, chronologie et demandes chiffrees.",
    dueDate: addDays(input.incidentDate, dayOffset(15)),
    documentTemplateId: docs.inspector,
    documentHref: createScenarioDocumentLink(input.scenario, docs.inspector),
  });

  steps.push({
    code: "legal_escalation",
    title: "Evaluation pre-contentieuse",
    description: "Structurer un dossier juridiquement defensible en cas d'echec amiable.",
    dueDate: addDays(input.incidentDate, dayOffset(21)),
  });

  const incidentAgeDays = Math.max(
    0,
    Math.floor((new Date(nowISO).getTime() - new Date(input.incidentDate).getTime()) / 86400000),
  );

  let riskScore = 0;
  if (!input.evidenceReady) riskScore += 24;
  if (!input.internalResolutionAttempted) riskScore += 18;
  if (input.urgentFinancialPressure) riskScore += 16;
  if (incidentAgeDays > 30) riskScore += 20;
  if (incidentAgeDays > 90) riskScore += 15;
  riskScore = Math.min(100, riskScore);

  const level: PreLitigationTimelineResult["level"] =
    riskScore >= 70 ? "high" : riskScore >= 40 ? "medium" : "low";

  return {
    riskScore,
    level,
    steps,
  };
}
