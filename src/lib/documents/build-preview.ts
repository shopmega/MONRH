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

function formatDate(dateString: string): string {
  if (!dateString) return "";
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  const months = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
  ];
  
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

const FIELD_ALIASES = {
  employee_name: ["employee_name", "employeeName", "full_name", "fullName"],
  company_name: ["company_name", "companyName", "employer_name", "employerName"],
  period: ["period", "time_period", "timePeriod"],
  issue_summary: ["issue_summary", "issueSummary", "summary"],
  request: ["request", "demande", "request_details", "requestDetails"],
  amount_due: ["amount_due", "amountDue", "amount"],
  effective_date: ["effective_date", "effectiveDate", "date"],
  position: ["position", "job_title", "jobTitle"],
  worker_category: ["workerCategory", "worker_category"],
  notice_start_date: ["noticeStartDate", "notice_start_date"],
  effective_departure_date: ["effectiveDepartureDate", "effective_departure_date", "effective_date", "effectiveDate"],
  contract_type: ["contractType", "contract_type"],
  hire_date: ["hireDate", "hire_date"],
  response_deadline_days: ["response_deadline_days", "responseDeadlineDays", "deadline_days", "deadlineDays"],
  city: ["city", "ville"],
  employee_id: ["employee_id", "employeeId", "matricule"],
  contract_ref: ["contract_ref", "contractRef", "reference_contrat", "referenceContrat"],
} as const;

function pickFromAliases(
  values: Values,
  aliases: readonly string[],
  fallback: string,
): string {
  for (const alias of aliases) {
    const value = values[alias]?.trim();
    if (value && value.length > 0) return value;
  }
  return fallback;
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
  const employeeName = pickFromAliases(values, FIELD_ALIASES.employee_name, "");
  const companyName = pickFromAliases(values, FIELD_ALIASES.company_name, "");
  const period = pickFromAliases(values, FIELD_ALIASES.period, "");
  const issueSummary = pickFromAliases(values, FIELD_ALIASES.issue_summary, "");
  const request = pickFromAliases(values, FIELD_ALIASES.request, "");
  const amountDue = pickFromAliases(values, FIELD_ALIASES.amount_due, "");
  const effectiveDate = pickFromAliases(values, FIELD_ALIASES.effective_date, "");
  const effectiveDepartureDate = pickFromAliases(values, FIELD_ALIASES.effective_departure_date, effectiveDate);
  const noticeStartDate = pickFromAliases(values, FIELD_ALIASES.notice_start_date, "");
  const contractType = pickFromAliases(values, FIELD_ALIASES.contract_type, "");
  const hireDate = pickFromAliases(values, FIELD_ALIASES.hire_date, "");
  const position = pickFromAliases(values, FIELD_ALIASES.position, "");
  const workerCategory = pickFromAliases(values, FIELD_ALIASES.worker_category, "");
  const responseDeadline = pickFromAliases(values, FIELD_ALIASES.response_deadline_days, "7");
  const employeeLabel = employeeName || "le salarie";
  const companyLabel = companyName || "l'entreprise";
  const contextFallback = issueSummary || period || "situation professionnelle en attente de regularisation";
  const requestFallback = request || "regularisation de ma situation";

  const defaultData: PreviewData = {
    subject: templateTitle,
    intro: `Je soussigne(e) ${employeeLabel}, salarie(e) de ${companyLabel}, vous adresse la presente correspondance afin de formaliser ma demande.`,
    context: `Contexte factuel: ${contextFallback}.`,
    request: `Demande principale: ${requestFallback}.`,
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
        context: `Je vous informe de ma decision de demissionner de mon poste${position ? ` de ${position}` : ""}.`,
        request: [
          `Je sollicite la prise d'acte de ma demission${effectiveDepartureDate ? ` avec un depart effectif au ${formatDate(effectiveDepartureDate)}` : ""}, sous reserve du preavis applicable.`,
          noticeStartDate ? `Date de notification du preavis: ${formatDate(noticeStartDate)}.` : "",
          contractType || hireDate || workerCategory
            ? `Elements contractuels: ${[contractType, hireDate ? `embauche ${formatDate(hireDate)}` : "", workerCategory ? `categorie ${workerCategory}` : ""].filter(Boolean).join(", ")}.`
            : "",
        ].filter(Boolean).join(" "),
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
        context: `Je notifie l'execution du preavis lie a mon poste${position ? ` de ${position}` : ""}.`,
        request: `Date de fin souhaitee${effectiveDate ? `: ${formatDate(effectiveDate)}` : ""}. Merci de confirmer le solde de tout compte.`,
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
        context: period
          ? `Les salaires de la periode ${period} demeurent impayes.`
          : "Des salaires demeurent impayes sur une periode recente.",
        request: amountDue
          ? `Je demande le reglement du montant de ${amountDue} MAD dans les meilleurs delais.`
          : "Je demande la regularisation integrale des salaires dus dans les meilleurs delais.",
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
        context: period
          ? `Des heures supplementaires sur la periode ${period} n'ont pas ete regularisees.`
          : "Des heures supplementaires n'ont pas ete regularisees.",
        request: amountDue
          ? `Je sollicite le paiement du rappel estime a ${amountDue} MAD.`
          : "Je sollicite le paiement du rappel des heures supplementaires dues.",
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
        context: `Faits signales: ${issueSummary || "manquements repetes constates au sein de l'entreprise"}.`,
        request: `Je sollicite l'intervention de l'inspection pour ${request || "ouvrir une mediation et ordonner une regularisation"}.`,
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
        context: `Accident survenu${period ? ` le ${period}` : ""}. Details: ${issueSummary || "incident constate sur le lieu de travail"}.`,
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
        context: `Je sollicite mon conge maternite${effectiveDate ? ` a compter du ${formatDate(effectiveDate)}` : ""}.`,
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
        context: `Faits${period ? ` sur la periode ${period}` : ""}: ${issueSummary || "agissements repetes nuisant aux conditions de travail"}.`,
        request: `Je demande l'ouverture d'une enquete interne et des mesures de protection immediates.`,
        legalBasis:
          "L'employeur est tenu d'assurer la protection de la sante, de la securite et de la dignite au travail.",
        deadline:
          "Je sollicite un accusé de reception immediat et un plan d'action ecrit dans les meilleurs delais.",
        attachments: ["Echanges ecrits", "Temoignages", "Journal date des faits"],
        cc: ["Service RH", "Referent interne"],
      };
    case "salary-negotiation-letter":
      return {
        ...defaultData,
        subject: "Demande de Revalorisation Salariale",
        context: `Dans le cadre de l'evolution de mes missions et de mon engagement au sein de ${companyName || "l'entreprise"}.`,
        request: "Je sollicite une revision de ma remuneration fixe actuelle pour mieux l'aligner sur mes responsabilites et le marche.",
        legalBasis: "Cette demande est formulee dans un esprit de dialogue constructif et de reconnaissance mutuelle.",
        deadline: "Je reste disponible pour un entretien afin d'exposer mes arguments en detail.",
        attachments: ["Recapitulatif des realisations", "Etude de marche (facultatif)"],
        cc: ["Manager direct"],
      };
    case "promotion-request-email":
      return {
        ...defaultData,
        subject: "Demande de Promotion / Evolution de Poste",
        context: `Apres une periode de performance constante sur mon poste actuel de ${position || "collaborateur"}.`,
        request: "Je souhaite soumettre ma candidature pour une evolution vers des responsabilites superieures.",
        legalBasis: "L'evolution interne constitue un levier majeur de motivation et de croissance partagee.",
        deadline: "Je sollicite un point d'etape pour discuter des opportunites et de ma trajectoire.",
        attachments: ["Bilan de competences", "Proposition de nouvelles missions"],
        cc: ["Manager direct", "Service RH"],
      };
    case "compensation-comparison-report":
      return {
        ...defaultData,
        subject: "Rapport de Comparaison de Remuneration",
        context: "Analyse comparative entre deux scenarios de compensation (Salaire vs Bonus vs Avantages).",
        request: "Synthese des gains nets, de l'efficacite fiscale et du cout global employeur pour aide a la decision.",
        legalBasis: "Rapport purement informatif base sur les donnees de simulation Salarie.ma.",
        attachments: ["Detail des calculs", "Scenario de reference", "Projection annuelle"],
        cc: [],
      };
    case "bonus-request-letter":
      return {
        ...defaultData,
        subject: "Demande d'Attribution de Prime Exceptionnelle",
        context: "A l'issue de la reussite d'un projet majeur ou d'une periode de surcroit d'activite.",
        request: "Je sollicite l'octroi d'une prime exceptionnelle en reconnaissance des resultats obtenus.",
        legalBasis: "Les primes constituent un mode de recompense de la performance individuelle ou collective.",
        deadline: "Je reste a votre disposition pour toute precision sur les indicateurs de reussite.",
        attachments: ["Rapport de performance", "Emails de felicitation"],
        cc: ["Manager direct"],
      };
    case "variable-compensation-breakdown":
      return {
        ...defaultData,
        subject: "Detail de la Remuneration Variable / Bonus",
        context: "Justificatif detaille du calcul de la part variable pour la periode ecoulee.",
        request: "Recapitulatif des objectifs atteints, des taux de calcul et du net fiscal associe.",
        legalBasis: "Transparence des elements de remuneration conformement aux regles de l'entreprise.",
        attachments: ["Grille d'objectifs", "Tableau de calcul net"],
        cc: ["Service Paie"],
      };
    case "freelance-pricing-sheet":
      return {
        ...defaultData,
        subject: "Grille de Tarification (TJM) & Offre de Services",
        context: "Positionnement tarifaire base sur l'objectif de revenu net et les charges AE.",
        request: "Presentation du TJM (Tarif Journalier Moyen) et des modalites de collaboration.",
        legalBasis: "Offre commerciale de prestation de services en tant qu'auto-entrepreneur.",
        attachments: ["Portfolio de services", "Detail des options de facturation"],
        cc: [],
      };
    case "invoice-template":
      return {
        ...defaultData,
        subject: "Facture / Modele de Facturation",
        context: "Document de facturation pour prestations de services ou vente de biens.",
        request: "Demande de reglement pour les prestations accomplies conformement au devis.",
        legalBasis: "Obligations de facturation liees au statut d'auto-entrepreneur au Maroc.",
        attachments: ["Devis signe", "Bon de livraison"],
        cc: [],
      };
    default:
      return defaultData;
  }
}

export function toPreviewText(data: PreviewData, values: Values): string {
  const rawDateValue = pickFromAliases(
    values,
    FIELD_ALIASES.effective_departure_date,
    pickFromAliases(values, FIELD_ALIASES.effective_date, new Date().toISOString().slice(0, 10)),
  );
  const dateValue = formatDate(rawDateValue);
  const location = pickFromAliases(values, FIELD_ALIASES.city, "Casablanca");
  const employeeName = pickFromAliases(values, FIELD_ALIASES.employee_name, "Le salarie");
  const companyName = pickFromAliases(values, FIELD_ALIASES.company_name, "L'entreprise");
  const employeeId = pickFromAliases(values, FIELD_ALIASES.employee_id, "");
  const contractRef = pickFromAliases(values, FIELD_ALIASES.contract_ref, "");
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
