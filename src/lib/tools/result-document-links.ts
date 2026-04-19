import type { SimulationResultSnapshot } from "@/lib/simulations/result-snapshot";

export type ResultDocumentLink = {
  templateId: string;
  title: string;
  description: string;
  href: string;
  ctaLabel?: string;
};

type ToolId =
  | "final_settlement_audit"
  | "disciplinary_procedure_check"
  | "fixed_term_contract_risk"
  | "pre_litigation_timeline";

const TEMPLATE_TITLES: Record<string, string> = {
  "contract-renewal-request": "Demande Renouvellement Contrat",
  "formal-complaint-employer": "Réclamation Formelle Employeur",
  "harassment-report-letter": "Signalement Harcèlement",
  "labor-inspector-complaint": "Plainte à l'Inspection du Travail",
  "maternity-leave-request": "Demande Congé Maternité",
  "notice-letter": "Lettre de Préavis",
  "overtime-claim-letter": "Demande Paiement Heures Sup",
  "resignation-letter": "Lettre de Démission",
  "salary-recovery-letter": "Demande de Salaire Impayé",
  "unpaid-leave-request": "Demande Congé Sans Solde",
  "work-accident-declaration": "Déclaration Accident du Travail",
};

const TEMPLATE_CTA_LABELS: Record<string, string> = {
  "contract-renewal-request": "Demander le renouvellement CDD",
  "harassment-report-letter": "Signaler le harcèlement",
  "labor-inspector-complaint": "Générer la plainte à l'inspection du travail",
  "maternity-leave-request": "Demander le congé maternité",
  "notice-letter": "Générer la lettre de préavis",
  "overtime-claim-letter": "Générer la mise en demeure (heures sup.)",
  "resignation-letter": "Générer la lettre de démission",
  "salary-recovery-letter": "Générer la mise en demeure (salaires impayés)",
  "unpaid-leave-request": "Demander un congé sans solde",
  "work-accident-declaration": "Déclarer l'accident du travail",
};

function titleForTemplate(templateId: string): string {
  return TEMPLATE_TITLES[templateId] ?? templateId;
}

function ctaLabelForTemplate(templateId: string): string {
  return TEMPLATE_CTA_LABELS[templateId] ?? titleForTemplate(templateId);
}

export function buildDocumentHref(
  templateId: string,
  params: Record<string, string | number | boolean | undefined>,
): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    query.set(key, String(value));
  }
  const suffix = query.toString();
  return suffix.length > 0 ? `/documents/${templateId}?${suffix}` : `/documents/${templateId}`;
}

function buildDocumentLink(
  templateId: string,
  description: string,
  params: Record<string, string | number | boolean | undefined>,
  ctaLabel?: string,
): ResultDocumentLink {
  return {
    templateId,
    title: titleForTemplate(templateId),
    description,
    href: buildDocumentHref(templateId, params),
    ctaLabel: ctaLabel ?? ctaLabelForTemplate(templateId),
  };
}

function uniqueByHref(items: ResultDocumentLink[]): ResultDocumentLink[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.href)) return false;
    seen.add(item.href);
    return true;
  });
}

export function buildSimulationResultDocumentLink(
  snapshot: SimulationResultSnapshot,
): ResultDocumentLink | null {
  const params = new URLSearchParams();
  const breakdown = snapshot.result.breakdown;
  const input = snapshot.inputPayload ?? {};
  const calculationDate = typeof input.calculationDate === "string" ? input.calculationDate : "";

  if (snapshot.calculatorType === "licenciement") {
    const total = typeof breakdown.totalEstimated === "number" ? breakdown.totalEstimated : undefined;
    const serviceYears =
      typeof breakdown.totalServiceYears === "number" ? breakdown.totalServiceYears : undefined;
    if (total !== undefined) {
      params.set("amount_due", String(total));
      params.set("request", `Regularisation des indemnites estimees a ${total} MAD.`);
    } else {
      params.set("request", "Regularisation des indemnites legales et des conges non regles.");
    }
    const isAbusive = Boolean(snapshot.result.breakdown.dommagesAbusif);
    if (isAbusive) {
      params.set("issue_summary", "Licenciement abusif et litige indemnites.");
    } else {
      params.set(
        "issue_summary",
        serviceYears ? `Licenciement apres ${serviceYears} an(s) d'anciennete.` : "Litige de licenciement.",
      );
    }
    const docId = "labor-inspector-complaint";
    return {
      templateId: docId,
      title: titleForTemplate(docId),
      description: "Escalade utile si le depart se transforme en litige indemnitaire.",
      href: `/documents/${docId}?${params.toString()}`,
      ctaLabel: ctaLabelForTemplate(docId),
    };
  }

  if (snapshot.calculatorType === "unpaid_salary_recovery") {
    const total =
      typeof breakdown.totalClaimAmount === "number" ? breakdown.totalClaimAmount : undefined;
    const unpaidMonths = typeof input.unpaidMonths === "number" ? input.unpaidMonths : undefined;
    if (calculationDate) params.set("period", unpaidMonths ? `Derniers ${unpaidMonths} mois` : calculationDate);
    if (total !== undefined) params.set("amount_due", String(total));
    params.set("issue_summary", "Salaires impayes constates.");
    const docId = "salary-recovery-letter";
    return {
      templateId: docId,
      title: titleForTemplate(docId),
      description: "Formalisez la reclamation avec le montant estime deja renseigne.",
      href: `/documents/${docId}?${params.toString()}`,
      ctaLabel: ctaLabelForTemplate(docId),
    };
  }

  if (
    snapshot.calculatorType === "unpaid_overtime_recovery" ||
    snapshot.calculatorType === "overtime" ||
    snapshot.calculatorType === "public_holiday_compensation"
  ) {
    const total =
      typeof breakdown.totalClaimAmount === "number"
        ? breakdown.totalClaimAmount
        : typeof breakdown.totalOvertimeAmount === "number"
          ? breakdown.totalOvertimeAmount
          : typeof breakdown.compensationAmount === "number"
            ? breakdown.compensationAmount
            : undefined;
    if (calculationDate) params.set("period", calculationDate);
    if (total !== undefined) params.set("amount_due", String(total));
    params.set("issue_summary", "Heures supplementaires non regularisees.");
    const docId = "overtime-claim-letter";
    return {
      templateId: docId,
      title: titleForTemplate(docId),
      description: "Passez du calcul au courrier avec les heures et montants deja prepares.",
      href: `/documents/${docId}?${params.toString()}`,
      ctaLabel: ctaLabelForTemplate(docId),
    };
  }

  if (snapshot.calculatorType === "duree_preavis" || snapshot.calculatorType === "demission") {
    const workerCategory =
      typeof breakdown.workerCategory === "string" ? breakdown.workerCategory : "employe";
    const leavePayout =
      typeof breakdown.leavePayout === "number" ? breakdown.leavePayout : undefined;
    const noticeComp =
      typeof breakdown.noticeCompensationDue === "number" ? breakdown.noticeCompensationDue : undefined;
    const recommendedDepartureDate =
      typeof breakdown.recommendedDepartureDate === "string" ? breakdown.recommendedDepartureDate : "";

    if (recommendedDepartureDate || calculationDate) {
      params.set("effective_date", recommendedDepartureDate || calculationDate);
    }
    if (leavePayout !== undefined) params.set("amount_due", String(leavePayout + (noticeComp ?? 0)));
    params.set("position", workerCategory);
    const docId = "resignation-letter";
    return {
      templateId: docId,
      title: titleForTemplate(docId),
      description: "Preparez une lettre de demission avec les informations deja connues.",
      href: `/documents/${docId}?${params.toString()}`,
      ctaLabel: ctaLabelForTemplate(docId),
    };
  }

  if (snapshot.calculatorType === "harassment_scenario") {
    if (calculationDate) params.set("period", calculationDate);
    params.set("issue_summary", "Signalement de faits de harcelement.");
    const docId = "harassment-report-letter";
    return {
      templateId: docId,
      title: titleForTemplate(docId),
      description: "Transformez l'evaluation en signalement ecrit structure.",
      href: `/documents/${docId}?${params.toString()}`,
      ctaLabel: ctaLabelForTemplate(docId),
    };
  }

  if (snapshot.calculatorType === "maternity_leave") {
    if (calculationDate) params.set("effective_date", calculationDate);
    params.set("request", "Conge maternite legal.");
    const docId = "maternity-leave-request";
    return {
      templateId: docId,
      title: titleForTemplate(docId),
      description: "Passez du calcul de droit a la demande de conge.",
      href: `/documents/${docId}?${params.toString()}`,
      ctaLabel: ctaLabelForTemplate(docId),
    };
  }

  if (snapshot.calculatorType === "work_accident") {
    if (calculationDate) params.set("period", calculationDate);
    params.set("issue_summary", "Accident du travail survenu.");
    const docId = "work-accident-declaration";
    return {
      templateId: docId,
      title: titleForTemplate(docId),
      description: "Declenchez la declaration avec le contexte deja renseigne.",
      href: `/documents/${docId}?${params.toString()}`,
      ctaLabel: ctaLabelForTemplate(docId),
    };
  }

  if (snapshot.calculatorType === "leave_accrual") {
    if (calculationDate) params.set("period", calculationDate);
    params.set("request", "Demande de conge exceptionnel.");
    const docId = "unpaid-leave-request";
    return {
      templateId: docId,
      title: titleForTemplate(docId),
      description: "Utilisez votre estimation de conges pour lancer la demande.",
      href: `/documents/${docId}?${params.toString()}`,
      ctaLabel: ctaLabelForTemplate(docId),
    };
  }

  if (snapshot.calculatorType === "fin_cdd") {
    params.set("request", "Proposition de renouvellement de contrat.");
    const docId = "contract-renewal-request";
    return {
      templateId: docId,
      title: titleForTemplate(docId),
      description: "Passez au modele de regularisation ou renouvellement du contrat.",
      href: `/documents/${docId}?${params.toString()}`,
      ctaLabel: ctaLabelForTemplate(docId),
    };
  }

  if (snapshot.calculatorType === "probation_termination") {
    if (calculationDate) params.set("effective_date", calculationDate);
    const docId = "notice-letter";
    return {
      templateId: docId,
      title: titleForTemplate(docId),
      description: "Formalisez la notification de preavis avec la date deja choisie.",
      href: `/documents/${docId}?${params.toString()}`,
      ctaLabel: ctaLabelForTemplate(docId),
    };
  }

  return null;
}

export function buildToolResultDocumentLinks({
  toolId,
  result,
}: {
  toolId: ToolId;
  result: unknown;
}): ResultDocumentLink[] {
  if (toolId === "final_settlement_audit") {
    const total = Number(
      ((result as { breakdown?: { totalEstimatedDue?: number } })?.breakdown?.totalEstimatedDue ?? 0),
    );
    return [
      buildDocumentLink(
        "salary-recovery-letter",
        "Demande de regularisation du solde final et montants non regles.",
        {
          period: "Solde de tout compte",
          amount_due: total > 0 ? total : undefined,
        },
      ),
      buildDocumentLink(
        "labor-inspector-complaint",
        "Escalade a l'inspection du travail si absence de regularisation.",
        {
          issue_summary: "Regularisation du solde de tout compte",
          request: total > 0 ? `Paiement d'un montant estime a ${total} MAD.` : "Regularisation des droits dus.",
        },
      ),
    ];
  }

  if (toolId === "disciplinary_procedure_check") {
    return [
      buildDocumentLink(
        "formal-complaint-employer",
        "Demande interne de revision de la procedure disciplinaire.",
        {
          issue_summary: "Contestation de la procedure disciplinaire",
          request: "Reexamen contradictoire et regularisation procedurale.",
        },
      ),
      buildDocumentLink(
        "labor-inspector-complaint",
        "Saisine externe en cas de procedure irreguliere persistante.",
        {
          issue_summary: "Irregularites dans la procedure disciplinaire",
          request: "Intervention et mediation sur le respect des droits de defense.",
        },
      ),
    ];
  }

  if (toolId === "fixed_term_contract_risk") {
    return [
      buildDocumentLink(
        "formal-complaint-employer",
        "Demande de clarification et regularisation du CDD.",
        {
          issue_summary: "Risque de requalification du CDD",
          request: "Mise en conformite des clauses du contrat.",
        },
      ),
      buildDocumentLink(
        "contract-renewal-request",
        "Demande ecrite de regularisation contractuelle (renouvellement ou ajustement).",
        {
          request: "Regularisation du contrat en conformite juridique.",
        },
      ),
    ];
  }

  if (toolId === "pre_litigation_timeline") {
    const steps = (result as {
      steps?: Array<{ documentTemplateId?: string; documentHref?: string }>;
    })?.steps;
    if (!Array.isArray(steps)) return [];
    return uniqueByHref(
      steps
        .filter((step) => step.documentTemplateId && step.documentHref)
        .map((step) => ({
          templateId: step.documentTemplateId as string,
          title: titleForTemplate(step.documentTemplateId as string),
          description: "Document recommande dans la feuille de route.",
          href: step.documentHref as string,
          ctaLabel: ctaLabelForTemplate(step.documentTemplateId as string),
        })),
    );
  }

  return [];
}
