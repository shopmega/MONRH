type Values = Record<string, string>;

type PreviewData = {
  subject: string;
  intro: string;
  context: string;
  request: string;
  closing: string;
  attachments: string[];
  nextSteps: string[];
  completion: number;
};

function pick(values: Values, key: string, fallback: string) {
  const value = values[key]?.trim();
  return value && value.length > 0 ? value : fallback;
}

function completionScore(values: Values): number {
  const keys = Object.keys(values);
  if (keys.length === 0) return 0;
  const filled = keys.filter((key) => (values[key] ?? "").trim().length > 0).length;
  return Math.round((filled / keys.length) * 100);
}

export function buildDocumentPreview(
  templateId: string,
  templateTitle: string,
  values: Values,
): PreviewData {
  const employeeName = pick(values, "employee_name", "[Nom employe]");
  const companyName = pick(values, "company_name", "[Nom entreprise]");
  const period = pick(values, "period", "[Periode]");
  const issueSummary = pick(values, "issue_summary", "[Resume des faits]");
  const request = pick(values, "request", "[Demande detaillee]");
  const amountDue = pick(values, "amount_due", "[Montant]");
  const effectiveDate = pick(values, "effective_date", "[Date]");
  const position = pick(values, "position", "[Poste]");

  const defaultData: PreviewData = {
    subject: templateTitle,
    intro: `Je soussigne(e) ${employeeName}, salarie(e) de ${companyName}, vous adresse la presente demande.`,
    context: `Contexte: ${issueSummary !== "[Resume des faits]" ? issueSummary : period}`,
    request: `Je sollicite: ${request !== "[Demande detaillee]" ? request : "regularisation de ma situation."}`,
    closing:
      "Dans l'attente de votre retour, je vous prie d'agreer mes salutations distinguees.",
    attachments: ["Copie CIN", "Copies bulletins/situations utiles", "Pieces justificatives"],
    nextSteps: [
      "Conserver preuve d'envoi (email LRAR ou depot avec accuse).",
      "Fixer un delai de reponse clair (ex: 7 jours).",
      "Escalader vers inspection du travail en absence de retour.",
    ],
    completion: completionScore(values),
  };

  switch (templateId) {
    case "resignation-letter":
      return {
        ...defaultData,
        subject: "Lettre de Demission",
        context: `Je vous informe de ma decision de demissionner de mon poste de ${position}.`,
        request: `Mon depart effectif est propose au ${effectiveDate}, sous reserve du preavis applicable.`,
        attachments: ["Copie contrat de travail"],
      };
    case "notice-letter":
      return {
        ...defaultData,
        subject: "Notification de Preavis",
        context: `Je notifie l'execution du preavis lie a mon poste de ${position}.`,
        request: `Date de fin souhaitee: ${effectiveDate}. Merci de confirmer le solde de tout compte.`,
        attachments: ["Copie lettre de demission", "Copie contrat"],
      };
    case "salary-recovery-letter":
      return {
        ...defaultData,
        subject: "Reclamation de Salaire Impaye",
        context: `Les salaires de la periode ${period} demeurent impayes.`,
        request: `Je demande le reglement du montant de ${amountDue} MAD dans les meilleurs delais.`,
        attachments: ["Copies bulletins", "Releve bancaire", "Contrat de travail"],
      };
    case "overtime-claim-letter":
      return {
        ...defaultData,
        subject: "Reclamation Heures Supplementaires",
        context: `Des heures supplementaires sur la periode ${period} n'ont pas ete regularisees.`,
        request: `Je sollicite le paiement du rappel estime a ${amountDue} MAD.`,
        attachments: ["Plannings/pointage", "Messages de supervision", "Bulletins de paie"],
      };
    case "labor-inspector-complaint":
      return {
        ...defaultData,
        subject: "Plainte a l'Inspection du Travail",
        context: `Faits signales: ${issueSummary}.`,
        request: `Je sollicite l'intervention de l'inspection pour ${request}.`,
        attachments: ["Chronologie des faits", "Pieces contractuelles", "Preuves de reclamation prealable"],
      };
    case "work-accident-declaration":
      return {
        ...defaultData,
        subject: "Declaration Accident du Travail",
        context: `Accident survenu le ${period}. Details: ${issueSummary}.`,
        request: "Je demande la prise en charge et les formalites legales correspondantes.",
        attachments: ["Certificat medical initial", "Temoignages", "Justificatifs de poste"],
      };
    case "maternity-leave-request":
      return {
        ...defaultData,
        subject: "Demande de Conge Maternite",
        context: `Je sollicite mon conge maternite a compter du ${effectiveDate}.`,
        request: `Merci de traiter ma demande et de confirmer les demarches CNSS.`,
        attachments: ["Certificat medical", "Justificatifs CNSS"],
      };
    case "harassment-report-letter":
      return {
        ...defaultData,
        subject: "Signalement d'Agissements de Harcelement",
        context: `Faits sur la periode ${period}: ${issueSummary}.`,
        request: `Je demande l'ouverture d'une enquete interne et des mesures de protection immediates.`,
        attachments: ["Echanges ecrits", "Temoignages", "Journal date des faits"],
      };
    default:
      return defaultData;
  }
}

export function toPreviewText(data: PreviewData, values: Values): string {
  const dateValue = pick(values, "effective_date", new Date().toISOString().slice(0, 10));
  return [
    `Date: ${dateValue}`,
    "",
    `Objet: ${data.subject}`,
    "",
    data.intro,
    "",
    data.context,
    data.request,
    "",
    data.closing,
    "",
    pick(values, "employee_name", "[Signature]"),
  ].join("\n");
}
