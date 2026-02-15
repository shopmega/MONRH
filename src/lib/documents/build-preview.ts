type Values = Record<string, string>;

type PreviewData = {
  subject: string;
  intro: string;
  context: string;
  request: string;
  legalBasis: string;
  deadline: string;
  closing: string;
  attachments: string[];
  cc: string[];
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
  const responseDeadline = pick(values, "response_deadline_days", "7");

  const defaultData: PreviewData = {
    subject: templateTitle,
    intro: `Je soussigne(e) ${employeeName}, salarie(e) de ${companyName}, vous adresse la presente correspondance afin de formaliser ma demande.`,
    context: `Contexte factuel: ${issueSummary !== "[Resume des faits]" ? issueSummary : period}.`,
    request: `Demande principale: ${request !== "[Demande detaillee]" ? request : "regularisation de ma situation."}`,
    legalBasis:
      "Cette demande s'inscrit dans le respect des obligations legales et contractuelles applicables a la relation de travail.",
    deadline: `Je vous prie de bien vouloir me repondre dans un delai de ${responseDeadline} jours a compter de la reception du present courrier.`,
    closing:
      "A defaut de reponse dans ce delai, je me reserverai le droit de saisir les voies de recours appropriees. Je vous prie d'agreer mes salutations distinguees.",
    attachments: ["Copie CIN", "Copies bulletins/situations utiles", "Pieces justificatives"],
    cc: ["Service RH", "Inspection du travail (si necessaire)"],
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
        request: `Je sollicite la prise d'acte de ma demission avec un depart effectif au ${effectiveDate}, sous reserve du preavis applicable.`,
        legalBasis:
          "Cette demission est formulee conformement aux dispositions contractuelles et au Code du travail.",
        deadline: "Merci de confirmer par ecrit la date de fin et les modalites du solde de tout compte.",
        attachments: ["Copie contrat de travail"],
        cc: ["Service RH", "Manager direct"],
      };
    case "notice-letter":
      return {
        ...defaultData,
        subject: "Notification de Preavis",
        context: `Je notifie l'execution du preavis lie a mon poste de ${position}.`,
        request: `Date de fin souhaitee: ${effectiveDate}. Merci de confirmer le solde de tout compte.`,
        legalBasis:
          "Cette notification est communiquee conformement au preavis applicable a ma situation contractuelle.",
        deadline: "Merci de confirmer les dates retenues et les obligations reciproques par ecrit.",
        attachments: ["Copie lettre de demission", "Copie contrat"],
        cc: ["Service RH"],
      };
    case "salary-recovery-letter":
      return {
        ...defaultData,
        subject: "Reclamation de Salaire Impaye",
        context: `Les salaires de la periode ${period} demeurent impayes.`,
        request: `Je demande le reglement du montant de ${amountDue} MAD dans les meilleurs delais.`,
        legalBasis:
          "Le paiement du salaire dans les delais convenus constitue une obligation essentielle de l'employeur.",
        deadline: `Je vous mets en demeure de regulariser la somme due sous ${responseDeadline} jours.`,
        attachments: ["Copies bulletins", "Releve bancaire", "Contrat de travail"],
        cc: ["Service RH", "Inspection du travail"],
      };
    case "overtime-claim-letter":
      return {
        ...defaultData,
        subject: "Reclamation Heures Supplementaires",
        context: `Des heures supplementaires sur la periode ${period} n'ont pas ete regularisees.`,
        request: `Je sollicite le paiement du rappel estime a ${amountDue} MAD.`,
        legalBasis:
          "Les heures supplementaires doivent etre remunerees selon les majorations legales en vigueur.",
        deadline: `Merci de proceder a la regularisation sous ${responseDeadline} jours.`,
        attachments: ["Plannings/pointage", "Messages de supervision", "Bulletins de paie"],
        cc: ["Service RH", "Inspection du travail"],
      };
    case "labor-inspector-complaint":
      return {
        ...defaultData,
        subject: "Plainte a l'Inspection du Travail",
        context: `Faits signales: ${issueSummary}.`,
        request: `Je sollicite l'intervention de l'inspection pour ${request}.`,
        legalBasis:
          "La presente plainte est deposee pour solliciter une intervention de mediation et de controle des obligations legales.",
        deadline:
          "Je reste disponible pour toute audience de conciliation et pour fournir des pieces complementaires.",
        attachments: ["Chronologie des faits", "Pieces contractuelles", "Preuves de reclamation prealable"],
        cc: ["Employeur", "Service RH"],
      };
    case "work-accident-declaration":
      return {
        ...defaultData,
        subject: "Declaration Accident du Travail",
        context: `Accident survenu le ${period}. Details: ${issueSummary}.`,
        request: "Je demande la prise en charge et les formalites legales correspondantes.",
        legalBasis:
          "Cette declaration est effectuee au titre des obligations de declaration et de prise en charge des accidents du travail.",
        deadline:
          "Merci de confirmer sans delai les formalites accomplies et la transmission aux organismes competents.",
        attachments: ["Certificat medical initial", "Temoignages", "Justificatifs de poste"],
        cc: ["Service RH", "CNSS"],
      };
    case "maternity-leave-request":
      return {
        ...defaultData,
        subject: "Demande de Conge Maternite",
        context: `Je sollicite mon conge maternite a compter du ${effectiveDate}.`,
        request: `Merci de traiter ma demande et de confirmer les demarches CNSS.`,
        legalBasis:
          "Cette demande est formulee au titre du droit au conge maternite et des garanties de protection applicables.",
        deadline: "Merci de confirmer les dates et formalites sous un delai raisonnable.",
        attachments: ["Certificat medical", "Justificatifs CNSS"],
        cc: ["Service RH"],
      };
    case "harassment-report-letter":
      return {
        ...defaultData,
        subject: "Signalement d'Agissements de Harcelement",
        context: `Faits sur la periode ${period}: ${issueSummary}.`,
        request: `Je demande l'ouverture d'une enquete interne et des mesures de protection immediates.`,
        legalBasis:
          "L'employeur est tenu d'assurer la protection de la sante, de la securite et de la dignite au travail.",
        deadline:
          "Je sollicite un accusé de reception immediat et un plan d'action ecrit dans les meilleurs delais.",
        attachments: ["Echanges ecrits", "Temoignages", "Journal date des faits"],
        cc: ["Service RH", "Referent interne"],
      };
    default:
      return defaultData;
  }
}

export function toPreviewText(data: PreviewData, values: Values): string {
  const dateValue = pick(values, "effective_date", new Date().toISOString().slice(0, 10));
  const location = pick(values, "city", "[Ville]");
  const employeeName = pick(values, "employee_name", "[Nom employe]");
  const companyName = pick(values, "company_name", "[Nom entreprise]");
  const employeeId = pick(values, "employee_id", "");
  const contractRef = pick(values, "contract_ref", "");
  const references = [employeeId ? `Matricule: ${employeeId}` : "", contractRef ? `Ref contrat: ${contractRef}` : ""]
    .filter((item) => item.length > 0)
    .join(" | ");

  return [
    `${location}, le ${dateValue}`,
    "",
    `De: ${employeeName}`,
    `A: ${companyName}`,
    "",
    `Objet: ${data.subject}`,
    references.length > 0 ? `Reference: ${references}` : "",
    "",
    data.intro,
    "",
    data.context,
    data.request,
    data.legalBasis,
    data.deadline,
    "",
    "Pieces jointes:",
    ...data.attachments.map((item) => `- ${item}`),
    "",
    data.cc.length > 0 ? `Copie: ${data.cc.join(" | ")}` : "",
    "",
    data.closing,
    "",
    "Signature:",
    employeeName,
  ].join("\n");
}
