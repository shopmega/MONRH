import type { SimulationResultSnapshot } from "@/lib/simulations/result-snapshot";
import type { UserJourneyContext } from "@/lib/context/user-journey-context";

export interface PrefillData {
  [key: string]: string | number | boolean;
}

export interface DocumentPrefillRule {
  simulatorType: string;
  documentId: string;
  fieldMappings: Record<string, string>;
  conditions?: (simulation: any, context: UserJourneyContext) => boolean;
}

// Document prefilling rules
const PREFILL_RULES: DocumentPrefillRule[] = [
  // Net/Gross to Salary Verification Request
  {
    simulatorType: "net_gross_enhanced",
    documentId: "salary-verification-request",
    fieldMappings: {
      grossSalary: "salary_gross",
      netSalary: "salary_net",
      familySituation: "family_status",
      dependentChildren: "dependents",
      employerTotalCost: "total_cost",
      calculationDate: "calculation_date"
    }
  },
  
  // Net/Gross to Employment Certificate Request
  {
    simulatorType: "net_gross_enhanced",
    documentId: "employment-certificate-request",
    fieldMappings: {
      grossSalary: "current_salary",
      monthlySalary: "monthly_salary",
      contractType: "contract_type",
      workerCategory: "position_category",
      calculationDate: "employment_date"
    }
  },
  
  // Licenciement to Labor Inspector Complaint
  {
    simulatorType: "licenciement_enhanced",
    documentId: "labor-inspector-complaint",
    fieldMappings: {
      monthlySalary: "salary_amount",
      yearsOfService: "service_years",
      monthsOfService: "service_months",
      contractType: "contract_type",
      workerCategory: "worker_category",
      dismissalReason: "dismissal_reason",
      dismissalReasonDetails: "dismissal_details",
      legalIndemnity: "indemnity_amount",
      abusive: "abusive_dismissal",
      priorWarnings: "prior_warnings",
      hrNotified: "hr_notification",
      calculationDate: "incident_date"
    },
    conditions: (simulation, context) => {
      // Only suggest labor inspector complaint for dismissals with issues
      return simulation.breakdown.legalRiskLevel > 5 || 
             simulation.breakdown.proceduralCompliance < 70 ||
             simulation.input.abusive;
    }
  },
  
  // Licenciement to Final Settlement Request
  {
    simulatorType: "licenciement_enhanced",
    documentId: "final-settlement-request",
    fieldMappings: {
      monthlySalary: "monthly_salary",
      yearsOfService: "service_years",
      monthsOfService: "service_months",
      unusedLeaveDays: "unused_leave_days",
      legalIndemnity: "legal_indemnity",
      noticeIndemnity: "notice_indemnity",
      leavePayout: "leave_payout",
      totalEstimated: "total_amount",
      calculationDate: "settlement_date"
    }
  },
  
  // Harassment Scenario to Harassment Report Letter
  {
    simulatorType: "harassment_scenario",
    documentId: "harassment-report-letter",
    fieldMappings: {
      harassmentType: "harassment_type",
      perpetratorRelationship: "perpetrator_relationship",
      incidentsCount: "incidents_count",
      witnessesCount: "witness_count",
      hasWrittenProof: "written_proof",
      hasMedicalProof: "medical_proof",
      hrNotified: "hr_notified",
      companySize: "company_size",
      calculationDate: "incident_date"
    }
  },
  
  // Unpaid Salary Recovery to Salary Recovery Letter
  {
    simulatorType: "unpaid_salary_recovery",
    documentId: "salary-recovery-letter",
    fieldMappings: {
      monthlySalary: "monthly_salary",
      unpaidMonths: "unpaid_months",
      totalClaimAmount: "claim_amount",
      calculationDate: "claim_date"
    }
  },
  
  // Overtime to Overtime Claim Letter
  {
    simulatorType: "overtime",
    documentId: "overtime-claim-letter",
    fieldMappings: {
      monthlySalary: "monthly_salary",
      overtimeDayHours: "overtime_day_hours",
      overtimeNightHours: "overtime_night_hours",
      overtimeWeekendHours: "overtime_weekend_hours",
      overtimeHolidayHours: "overtime_holiday_hours",
      totalOvertimeAmount: "total_overtime_amount",
      calculationDate: "claim_date"
    }
  },
  
  // Leave Accrual to Leave Request Form
  {
    simulatorType: "leave_accrual",
    documentId: "leave-request-form",
    fieldMappings: {
      monthsWorked: "months_worked",
      seniorityYears: "seniority_years",
      totalAvailableDays: "available_days",
      remainingDays: "remaining_days",
      calculationDate: "request_date"
    }
  },
  
  // Annual Income Tax to Tax Optimization Request
  {
    simulatorType: "annual_income_tax",
    documentId: "tax-optimization-request",
    fieldMappings: {
      annualGrossIncome: "annual_gross_income",
      annualTaxableIncome: "annual_taxable_income",
      annualIncomeTax: "annual_income_tax",
      effectiveTaxRate: "effective_tax_rate",
      calculationDate: "tax_year"
    }
  },
  
  // Employer Total Cost to Salary Negotiation Letter
  {
    simulatorType: "employer_total_cost",
    documentId: "salary-negotiation-letter",
    fieldMappings: {
      grossSalary: "current_salary",
      employerTotalCost: "total_cost",
      effectiveBurdenRate: "burden_rate",
      calculationDate: "negotiation_date"
    }
  }
];

export function generatePrefillData(
  simulation: SimulationResultSnapshot,
  context: UserJourneyContext
): PrefillData {
  const prefilledData: PrefillData = {};
  
  // Add common fields from context
  if (context.personal.firstName) {
    prefilledData.employee_name = `${context.personal.firstName} ${context.personal.lastName || ""}`;
  }
  
  if (context.employment.companyName) {
    prefilledData.company_name = context.employment.companyName;
  }
  
  if (context.employment.position) {
    prefilledData.position = context.employment.position;
  }
  
  // Find applicable prefilling rules
  const applicableRules = PREFILL_RULES.filter(rule => 
    rule.simulatorType === simulation.calculatorType
  );
  
  // Apply each rule
  for (const rule of applicableRules) {
    // Check conditions if any
    if (rule.conditions && !rule.conditions(simulation, context)) {
      continue;
    }
    
    // Apply field mappings
    for (const [sourceField, targetField] of Object.entries(rule.fieldMappings)) {
      const sourceValue = getNestedValue(simulation, sourceField);
      if (sourceValue !== undefined && sourceValue !== null) {
        prefilledData[targetField] = sourceValue;
      }
    }
  }
  
  return prefilledData;
}

export function generatePrefillUrl(
  documentId: string,
  prefilledData: PrefillData
): string {
  const searchParams = new URLSearchParams();
  
  for (const [key, value] of Object.entries(prefilledData)) {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  }
  
  return `/documents/${documentId}?${searchParams.toString()}`;
}

export function getDocumentSuggestions(
  simulation: SimulationResultSnapshot,
  context: UserJourneyContext
): Array<{ id: string; title: string; description: string; priority: number }> {
  const suggestions = [];
  const applicableRules = PREFILL_RULES.filter(rule => 
    rule.simulatorType === simulation.calculatorType
  );
  
  for (const rule of applicableRules) {
    // Check conditions if any
    if (rule.conditions && !rule.conditions(simulation, context)) {
      continue;
    }
    
    // Calculate priority based on simulation results and context
    let priority = 5; // Medium priority
    
    if (simulation.calculatorType === "licenciement_enhanced") {
      const riskLevel = (simulation.result.breakdown.legalRiskLevel || 0) as number;
      if (riskLevel > 7) priority = 1; // High priority
      else if (riskLevel > 5) priority = 2; // Medium-high priority
      else if (riskLevel > 3) priority = 3; // Medium priority
    }
    
    if (simulation.calculatorType === "net_gross_enhanced") {
      // High priority for tax optimization
      priority = 2;
    }
    
    if (simulation.calculatorType === "harassment_scenario") {
      const dossierStrength = (simulation.result.breakdown.dossierStrengthScore || 0) as number;
      if (dossierStrength < 40) priority = 1; // High priority
      else if (dossierStrength < 65) priority = 2; // Medium priority
    }
    
    suggestions.push({
      id: rule.documentId,
      title: generateDocumentTitle(rule.documentId, simulation, context),
      description: generateDocumentDescription(rule.documentId, simulation, context),
      priority
    });
  }
  
  // Sort by priority (lower number = higher priority)
  return suggestions.sort((a, b) => a.priority - b.priority);
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

function generateDocumentTitle(documentId: string, simulation: SimulationResultSnapshot, context: UserJourneyContext): string {
  const titles: Record<string, string> = {
    "salary-verification-request": "Demande de Vérification de Salaire",
    "employment-certificate-request": "Demande d'Attestation de Travail",
    "labor-inspector-complaint": "Plainte auprès de l'Inspection du Travail",
    "final-settlement-request": "Demande de Solde de Tout Compte",
    "harassment-report-letter": "Rapport de Harcèlement",
    "salary-recovery-letter": "Lettre de Mise en Demeure",
    "overtime-claim-letter": "Lettre de Réclamation Heures Supplémentaires",
    "leave-request-form": "Demande de Congés",
    "tax-optimization-request": "Demande d'Optimisation Fiscale",
    "salary-negotiation-letter": "Lettre de Négociation Salariale"
  };
  
  return titles[documentId] || "Document Légal";
}

function generateDocumentDescription(documentId: string, simulation: SimulationResultSnapshot, context: UserJourneyContext): string {
  const descriptions: Record<string, string> = {
    "salary-verification-request": "Générer une demande officielle de vérification de votre salaire basée sur votre calcul",
    "employment-certificate-request": "Obtenir une attestation de travail et de salaire pour vos démarches",
    "labor-inspector-complaint": "Déposer une plainte officielle auprès de l'inspection du travail pour vos droits",
    "final-settlement-request": "Calculer et demander le paiement de tous vos droits et indemnités",
    "harassment-report-letter": "Documenter et signaler les faits de harcèlement de manière officielle",
    "salary-recovery-letter": "Exiger le paiement de vos salaires impayés avec calcul des pénalités",
    "overtime-claim-letter": "Réclamer le paiement de vos heures supplémentaires non rémunérées",
    "leave-request-form": "Demander des congés basés sur votre solde calculé",
    "tax-optimization-request": "Optimiser votre situation fiscale basée sur les calculs de revenu",
    "salary-negotiation-letter": "Préparer une négociation salariale basée sur le coût total employeur"
  };
  
  return descriptions[documentId] || "Générer un document légal basé sur votre simulation";
}

export function getPrefillDataForDocument(
  documentId: string,
  simulation: SimulationResultSnapshot,
  context: UserJourneyContext
): PrefillData {
  // Find the rule for this specific document
  const rule = PREFILL_RULES.find(rule => 
    rule.documentId === documentId && 
    rule.simulatorType === simulation.calculatorType
  );
  
  if (!rule) {
    return {};
  }
  
  // Check conditions
  if (rule.conditions && !rule.conditions(simulation, context)) {
    return {};
  }
  
  const prefilledData: PrefillData = {};
  
  // Apply field mappings
  for (const [sourceField, targetField] of Object.entries(rule.fieldMappings)) {
    const sourceValue = getNestedValue(simulation, sourceField);
    if (sourceValue !== undefined && sourceValue !== null) {
      prefilledData[targetField] = sourceValue;
    }
  }
  
  return prefilledData;
}
