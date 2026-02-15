export type ResultDocumentLink = {
  templateId: string;
  title: string;
  description: string;
  href: string;
};

type ToolId =
  | "final_settlement_audit"
  | "disciplinary_procedure_check"
  | "fixed_term_contract_risk"
  | "pre_litigation_timeline";

const TEMPLATE_TITLES: Record<string, string> = {
  "salary-recovery-letter": "Demande de Salaire Impaye",
  "overtime-claim-letter": "Demande Paiement Heures Sup",
  "formal-complaint-employer": "Reclamation Formelle Employeur",
  "labor-inspector-complaint": "Plainte a l'Inspection du Travail",
  "contract-renewal-request": "Demande Renouvellement Contrat",
  "harassment-report-letter": "Signalement Harcelement",
};

function titleForTemplate(templateId: string): string {
  return TEMPLATE_TITLES[templateId] ?? templateId;
}

function buildDocumentHref(
  templateId: string,
  params: Record<string, string | number | undefined>,
): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    query.set(key, String(value));
  }
  const suffix = query.toString();
  return suffix.length > 0 ? `/documents/${templateId}?${suffix}` : `/documents/${templateId}`;
}

function uniqueByHref(items: ResultDocumentLink[]): ResultDocumentLink[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.href)) return false;
    seen.add(item.href);
    return true;
  });
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
      ((result as { breakdown?: { totalEstimatedDue?: number } })?.breakdown?.totalEstimatedDue ??
        0),
    );
    return [
      {
        templateId: "salary-recovery-letter",
        title: titleForTemplate("salary-recovery-letter"),
        description: "Demande de regularisation du solde final et montants non regles.",
        href: buildDocumentHref("salary-recovery-letter", {
          period: "Solde de tout compte",
          amount_due: total > 0 ? total : undefined,
        }),
      },
      {
        templateId: "labor-inspector-complaint",
        title: titleForTemplate("labor-inspector-complaint"),
        description: "Escalade a l'inspection du travail si absence de regularisation.",
        href: buildDocumentHref("labor-inspector-complaint", {
          issue_summary: "Regularisation du solde de tout compte",
          request: total > 0 ? `Paiement d'un montant estime a ${total} MAD.` : "Regularisation des droits dus.",
        }),
      },
    ];
  }

  if (toolId === "disciplinary_procedure_check") {
    return [
      {
        templateId: "formal-complaint-employer",
        title: titleForTemplate("formal-complaint-employer"),
        description: "Demande interne de revision de la procedure disciplinaire.",
        href: buildDocumentHref("formal-complaint-employer", {
          issue_summary: "Contestation de la procedure disciplinaire",
          request: "Reexamen contradictoire et regularisation procedurale.",
        }),
      },
      {
        templateId: "labor-inspector-complaint",
        title: titleForTemplate("labor-inspector-complaint"),
        description: "Saisine externe en cas de procedure irréguliere persistante.",
        href: buildDocumentHref("labor-inspector-complaint", {
          issue_summary: "Irregularites dans la procedure disciplinaire",
          request: "Intervention et mediation sur le respect des droits de defense.",
        }),
      },
    ];
  }

  if (toolId === "fixed_term_contract_risk") {
    return [
      {
        templateId: "formal-complaint-employer",
        title: titleForTemplate("formal-complaint-employer"),
        description: "Demande de clarification et regularisation du CDD.",
        href: buildDocumentHref("formal-complaint-employer", {
          issue_summary: "Risque de requalification du CDD",
          request: "Mise en conformite des clauses du contrat.",
        }),
      },
      {
        templateId: "contract-renewal-request",
        title: titleForTemplate("contract-renewal-request"),
        description: "Demande ecrite de regularisation contractuelle (renouvellement ou ajustement).",
        href: buildDocumentHref("contract-renewal-request", {
          request: "Regularisation du contrat en conformite juridique.",
        }),
      },
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
        })),
    );
  }

  return [];
}
