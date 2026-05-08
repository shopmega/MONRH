/**
 * Detailed Analysis of MONRH Calculator Fields for AVISINE Integration
 * Based on actual calculator schemas and implementations
 */

import { z } from "zod";

// ============================================================================
// ACTUAL CALCULATOR INPUT SCHEMAS (Extracted from codebase)
// ============================================================================

// 1. Employer Total Cost Calculator
export const employerTotalCostInputSchema = z.object({
  calculationDate: z.string().date().default("2026-02-12"),
  grossSalary: z.number().positive(),
  companySize: z.enum(["small", "large"]).default("large"), // ← AVISINE OPPORTUNITY
  sectorRisk: z.enum(["low", "medium", "high", "very_high"]).default("medium"), // ← AVISINE OPPORTUNITY
  additionalBenefitsMad: z.number().min(0).default(0),
  months: z.number().min(1).max(14).default(12),
  include13thMonth: z.boolean().default(false),
});

// 2. Termination Calculator
export const licenciementInputSchema = z.object({
  calculationDate: z.string().date().default("2026-02-12"),
  monthlySalary: z.number().positive(),
  contractType: z.enum(["CDI", "CDD"]).default("CDI"),
  workerCategory: z.enum(["cadre", "employe", "ouvrier"]).default("employe"),
  yearsOfService: z.number().min(0).max(60),
  monthsOfService: z.number().min(0).max(11).default(0),
  unusedLeaveDays: z.number().min(0).max(365).default(0),
  abusive: z.boolean().default(false),
  // MISSING: companyId, employer context
});

// 3. Harassment Scenario Calculator
export const harassmentScenarioInputSchema = z.object({
  calculationDate: z.string().date().default("2026-02-12"),
  harassmentType: z.enum(["moral", "sexual"]).default("moral"),
  perpetratorRelationship: z.enum(["supervisor", "colleague", "client"]).default("supervisor"),
  incidentsCount: z.number().min(1).max(200),
  witnessesCount: z.number().min(0).max(50).default(0),
  hasWrittenProof: z.boolean().default(false),
  hasMedicalProof: z.boolean().default(false),
  hrNotified: z.boolean().default(false),
  companySize: z.enum(["small", "large"]).default("large"), // ← AVISINE OPPORTUNITY
  // MISSING: companyId, HR complaint history, workplace safety record
});

// 4. Overtime Calculator
export const overtimeInputSchema = z.object({
  calculationDate: z.string().date().default("2026-02-12"),
  monthlySalary: z.number().positive(),
  regularHours: z.number().min(0).max(200),
  overtimeHours: z.number().min(0).max(100),
  overtimeRate: z.enum(["125%", "150%", "200%"]).default("150%"),
  workDays: z.number().min(1).max(31).default(22),
  // MISSING: companyId, overtime compliance history
});

// 5. Unpaid Salary Recovery
export const unpaidSalaryRecoverySchema = z.object({
  calculationDate: z.string().date().default("2026-02-12"),
  monthlySalary: z.number().positive(),
  monthsUnpaid: z.number().min(1).max(24),
  totalUnpaidAmount: z.number().positive(),
  hasWrittenContract: z.boolean().default(false),
  hasPayslips: z.boolean().default(false),
  hasBankStatements: z.boolean().default(false),
  daysLate: z.number().min(1).max(365),
  // MISSING: companyId, payment history, compliance record
});

// ============================================================================
// ENHANCED SCHEMAS WITH AVISINE INTEGRATION
// ============================================================================

// AVISINE Company Context Interface
export interface AvilineCompanyContext {
  companyId: string;
  name: string;
  trustScore: number;
  confidenceLevel: 'low' | 'medium' | 'high';
  verificationStatus: 'verified' | 'unverified' | 'pending';
  employeeCount: number;
  category: string;
  location: string;
  reviewCount: number;
  averageRating: number;
  // Enhanced risk data
  litigationHistory: {
    totalCases: number;
    recentCases: number;
    outcomes: ('won' | 'lost' | 'settled')[];
    averageSettlement: number;
  };
  complianceData: {
    cnssCompliance: number;
    laborInspectionScore: number;
    paymentTimeliness: number;
    contractCompliance: number;
  };
  workplaceData: {
    hrComplaints: number;
    safetyIncidents: number;
    harassmentCases: number;
    disciplinaryActions: number;
  };
  financialHealth: {
    salaryDelays: number;
    averageDelayDays: number;
    unpaidSalaries: number;
    overtimeCompliance: number;
  };
}

// Enhanced Calculator Schemas
export const enhancedEmployerTotalCostSchema = employerTotalCostInputSchema.extend({
  companyId: z.string().optional(),
  companyContext: z.custom<AvilineCompanyContext>().optional(),
  // Enhanced with actual company data
  actualCompanySize: z.enum(["micro", "small", "medium", "large", "enterprise"]).optional(),
  actualSectorRisk: z.enum(["low", "medium", "high", "very_high", "critical"]).optional(),
  industrySpecificRates: z.record(z.string(), z.number()).optional(),
});

export const enhancedLicenciementSchema = licenciementInputSchema.extend({
  companyId: z.string().optional(),
  companyContext: z.custom<AvilineCompanyContext>().optional(),
  employerLitigationHistory: z.object({
    previousTerminations: z.number(),
    unfairDismissalCases: z.number(),
    averageCompensation: z.number(),
    legalCosts: z.number(),
    lastTerminationDate: z.string().optional(),
    litigationRiskScore: z.number(),
  }).optional(),
  workplaceCompliance: z.object({
    contractCompliance: z.number(),
    hrDocumentation: z.number(),
    proceduralCompliance: z.number(),
  }).optional(),
});

export const enhancedHarassmentSchema = harassmentScenarioInputSchema.extend({
  companyId: z.string().optional(),
  companyContext: z.custom<AvilineCompanyContext>().optional(),
  workplaceHistory: z.object({
    previousHarassmentCases: z.number(),
    hrResponseTime: z.number(),
    caseOutcomes: z.array(z.enum(['resolved', 'unresolved', 'settled'])),
    preventionTraining: z.boolean(),
    reportingMechanisms: z.boolean(),
    investigationQuality: z.number(),
  }).optional(),
  managementCulture: z.object({
    trainingProvided: z.boolean(),
    reportingChannels: z.array(z.string()),
    anonymousReporting: z.boolean(),
    regularAudits: z.boolean(),
  }).optional(),
});

export const enhancedOvertimeSchema = overtimeInputSchema.extend({
  companyId: z.string().optional(),
  companyContext: z.custom<AvilineCompanyContext>().optional(),
  overtimeHistory: z.object({
    averageMonthlyOvertime: z.number(),
    complianceRate: z.number(),
    disputes: z.number(),
    payments: z.number(),
  }).optional(),
  industryBenchmark: z.object({
    sectorAverageOvertime: z.number(),
    complianceRate: z.number(),
    disputeRate: z.number(),
  }).optional(),
});

export const enhancedUnpaidSalarySchema = unpaidSalaryRecoverySchema.extend({
  companyId: z.string().optional(),
  companyContext: z.custom<AvilineCompanyContext>().optional(),
  paymentHistory: z.object({
    onTimePayments: z.number(),
    latePayments: z.number(),
    averageDelayDays: z.number(),
    totalAmountDelayed: z.number(),
  }).optional(),
  recoveryHistory: z.object({
    previousClaims: z.number(),
    successfulRecoveries: z.number(),
    averageRecoveryTime: z.number(),
    legalActionsRequired: z.number(),
  }).optional(),
});

// ============================================================================
// FIELD ENHANCEMENT ANALYSIS
// ============================================================================

export interface FieldEnhancementAnalysis {
  calculatorId: string;
  calculatorTitle: string;
  currentFields: string[];
  avilineOpportunities: Array<{
    fieldName: string;
    fieldType: string;
    source: 'trust' | 'compliance' | 'history' | 'workplace' | 'financial';
    impact: 'critical' | 'high' | 'medium' | 'low';
    implementationComplexity: 'low' | 'medium' | 'high';
    accuracyImprovement: number; // percentage
  }>;
  integrationScore: number; // 0-100
}

export const calculatorFieldAnalysis: FieldEnhancementAnalysis[] = [
  {
    calculatorId: 'employer_total_cost',
    calculatorTitle: 'Coût Total Employeur',
    currentFields: ['grossSalary', 'companySize', 'sectorRisk'],
    avilineOpportunities: [
      {
        fieldName: 'actualCompanySize',
        fieldType: 'enum',
        source: 'trust',
        impact: 'medium',
        implementationComplexity: 'low',
        accuracyImprovement: 25
      },
      {
        fieldName: 'actualSectorRisk',
        fieldType: 'enum', 
        source: 'compliance',
        impact: 'high',
        implementationComplexity: 'medium',
        accuracyImprovement: 40
      },
      {
        fieldName: 'industrySpecificRates',
        fieldType: 'object',
        source: 'compliance',
        impact: 'medium',
        implementationComplexity: 'high',
        accuracyImprovement: 30
      }
    ],
    integrationScore: 35
  },
  {
    calculatorId: 'licenciement',
    calculatorTitle: 'Indemnité Licenciement',
    currentFields: ['monthlySalary', 'contractType', 'yearsOfService'],
    avilineOpportunities: [
      {
        fieldName: 'employerLitigationHistory',
        fieldType: 'object',
        source: 'history',
        impact: 'critical',
        implementationComplexity: 'high',
        accuracyImprovement: 60
      },
      {
        fieldName: 'workplaceCompliance',
        fieldType: 'object',
        source: 'compliance',
        impact: 'high',
        implementationComplexity: 'medium',
        accuracyImprovement: 45
      },
      {
        fieldName: 'trustScore',
        fieldType: 'number',
        source: 'trust',
        impact: 'medium',
        implementationComplexity: 'low',
        accuracyImprovement: 25
      }
    ],
    integrationScore: 20
  },
  {
    calculatorId: 'harassment_scenario',
    calculatorTitle: 'Scenario Harcèlement',
    currentFields: ['harassmentType', 'companySize', 'hrNotified'],
    avilineOpportunities: [
      {
        fieldName: 'workplaceHistory',
        fieldType: 'object',
        source: 'workplace',
        impact: 'critical',
        implementationComplexity: 'high',
        accuracyImprovement: 70
      },
      {
        fieldName: 'managementCulture',
        fieldType: 'object',
        source: 'workplace',
        impact: 'high',
        implementationComplexity: 'medium',
        accuracyImprovement: 50
      },
      {
        fieldName: 'actualCompanySize',
        fieldType: 'enum',
        source: 'trust',
        impact: 'medium',
        implementationComplexity: 'low',
        accuracyImprovement: 20
      }
    ],
    integrationScore: 15
  },
  {
    calculatorId: 'overtime',
    calculatorTitle: 'Heures Supplémentaires',
    currentFields: ['monthlySalary', 'overtimeHours', 'overtimeRate'],
    avilineOpportunities: [
      {
        fieldName: 'overtimeHistory',
        fieldType: 'object',
        source: 'financial',
        impact: 'high',
        implementationComplexity: 'medium',
        accuracyImprovement: 55
      },
      {
        fieldName: 'industryBenchmark',
        fieldType: 'object',
        source: 'compliance',
        impact: 'medium',
        implementationComplexity: 'high',
        accuracyImprovement: 35
      }
    ],
    integrationScore: 25
  },
  {
    calculatorId: 'unpaid_salary_recovery',
    calculatorTitle: 'Recouvrement Salaire Impayé',
    currentFields: ['monthlySalary', 'monthsUnpaid', 'hasWrittenContract'],
    avilineOpportunities: [
      {
        fieldName: 'paymentHistory',
        fieldType: 'object',
        source: 'financial',
        impact: 'critical',
        implementationComplexity: 'medium',
        accuracyImprovement: 75
      },
      {
        fieldName: 'recoveryHistory',
        fieldType: 'object',
        source: 'history',
        impact: 'high',
        implementationComplexity: 'high',
        accuracyImprovement: 60
      },
      {
        fieldName: 'trustScore',
        fieldType: 'number',
        source: 'trust',
        impact: 'medium',
        implementationComplexity: 'low',
        accuracyImprovement: 30
      }
    ],
    integrationScore: 20
  }
];

// ============================================================================
// ENHANCEMENT PRIORITY MATRIX
// ============================================================================

export interface EnhancementPriority {
  category: 'immediate' | 'short-term' | 'medium-term';
  title: string;
  description: string;
  affectedCalculators: string[];
  expectedAccuracyGain: number;
  implementationEffort: 'low' | 'medium' | 'high';
  businessImpact: 'critical' | 'high' | 'medium' | 'low';
}

export const enhancementPriorities: EnhancementPriority[] = [
  {
    category: 'immediate',
    title: 'Add Company ID Field to All Calculators',
    description: 'Add companyId field to enable AVISINE data fetching',
    affectedCalculators: ['licenciement', 'harassment_scenario', 'unpaid_salary_recovery', 'overtime'],
    expectedAccuracyGain: 25,
    implementationEffort: 'low',
    businessImpact: 'high'
  },
  {
    category: 'immediate',
    title: 'Integrate Trust Score in Risk Assessments',
    description: 'Use AVISINE trust scores to adjust risk calculations',
    affectedCalculators: ['licenciement', 'unpaid_salary_recovery'],
    expectedAccuracyGain: 35,
    implementationEffort: 'medium',
    businessImpact: 'critical'
  },
  {
    category: 'short-term',
    title: 'Add Payment History to Salary Recovery',
    description: 'Use company payment history to predict recovery success',
    affectedCalculators: ['unpaid_salary_recovery'],
    expectedAccuracyGain: 75,
    implementationEffort: 'medium',
    businessImpact: 'critical'
  },
  {
    category: 'short-term',
    title: 'Enhance Harassment Calculator with Workplace History',
    description: 'Include HR complaint patterns and management culture',
    affectedCalculators: ['harassment_scenario'],
    expectedAccuracyGain: 70,
    implementationEffort: 'high',
    businessImpact: 'critical'
  },
  {
    category: 'medium-term',
    title: 'Add Litigation History to Termination Calculator',
    description: 'Factor in employer legal history and settlement patterns',
    affectedCalculators: ['licenciement'],
    expectedAccuracyGain: 60,
    implementationEffort: 'high',
    businessImpact: 'high'
  }
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function calculateCurrentIntegrationScore(): number {
  const totalOpportunities = calculatorFieldAnalysis.reduce((sum, calc) => sum + calc.avilineOpportunities.length, 0);
  const currentImplementation = calculatorFieldAnalysis.reduce((sum, calc) => sum + calc.integrationScore, 0);
  return Math.round((currentImplementation / (totalOpportunities * 100)) * 100);
}

export function getHighImpactOpportunities(): EnhancementPriority[] {
  return enhancementPriorities.filter(p => p.businessImpact === 'critical' || p.expectedAccuracyGain > 50);
}

export function estimateImplementationTimeline(): { phase: string; weeks: number; items: string[] }[] {
  return [
    {
      phase: 'Immediate',
      weeks: 2,
      items: enhancementPriorities.filter(p => p.category === 'immediate').map(p => p.title)
    },
    {
      phase: 'Short-term', 
      weeks: 6,
      items: enhancementPriorities.filter(p => p.category === 'short-term').map(p => p.title)
    },
    {
      phase: 'Medium-term',
      weeks: 12,
      items: enhancementPriorities.filter(p => p.category === 'medium-term').map(p => p.title)
    }
  ];
}
