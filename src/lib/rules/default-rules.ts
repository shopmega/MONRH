import * as fs from "node:fs";
import path from "node:path";

export type TaxBracket = {
  min: number;
  max: number | null;
  rate: number;
  deduction?: number;
};

export type ProfessionalExpenseTier = {
  maxGrossMonthly: number | null;
  rate: number;
  monthlyCap: number;
};

export type ProfessionalExpenseMode = "legacy_20_percent" | "reform_35_25_percent";

export type SalaryRules = {
  versionId: string;
  versionCode: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  cnssEmployeeShortTermRate?: number;
  cnssEmployeeLongTermRate?: number;
  cnssEmployeeRate: number;
  cnssEmployerShortTermRate?: number;
  cnssEmployerLongTermRate?: number;
  cnssEmployerRate: number;
  cnssCeiling: number;
  familyAllowanceEmployerRate: number;
  amoEmployeeRate: number;
  amoEmployerRate: number;
  professionalExpenseMode: ProfessionalExpenseMode;
  professionalExpenseRate: number;
  professionalExpenseCap: number;
  professionalExpenseTiers?: ProfessionalExpenseTier[];
  familyChargeReductionAnnual: number;
  familyChargeReductionCapAnnual: number;
  taxBracketsMonthly: TaxBracket[];
  /** Formation professionnelle rate for employers with ≤ 20 employees (1%) */
  formationProRateSmall: number;
  /** Formation professionnelle rate for employers with > 20 employees (1.6%) */
  formationProRateLarge: number;
};

export type NoticeDurationRule = {
  minYears: number;
  maxYears: number | null;
  value: number;
  unit: "day" | "month";
};

export type ForceMajeureRules = {
  preavisDue: boolean;
  damagesDue: boolean;
  legalIndemnityDue: boolean;
  warning: string;
};

export type TerminationRules = {
  versionId: string;
  versionCode: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  tranche1HoursPerYear: number;
  tranche2HoursPerYear: number;
  tranche3HoursPerYear: number;
  tranche4HoursPerYear: number;
  minimumSeniorityMonthsForLegalIndemnity: number;
  useFractionalYearsForIndemnity: boolean;
  referenceHoursPerMonth: number;
  abusiveBaseMonthsPerYear: number;
  abusiveCapMonths: number;
  legalIndemnityContractTypes: Array<"CDI" | "CDD">;
  cddEarlyTerminationCompensation: "remaining_salary_until_contract_end";
  forceMajeure: ForceMajeureRules;
  cddNoticeDaysByCategory: {
    cadre: number;
    employe: number;
    ouvrier: number;
  };
  cdiNoticeMonthsByCategory: {
    cadre: { lt1: number; gte1lt5: number; gte5: number };
    employe: { lt1: number; gte1lt5: number; gte5: number };
    ouvrier: { lt1: number; gte1lt5: number; gte5: number };
  };
  cdiNoticeRulesByCategory: {
    cadre: NoticeDurationRule[];
    employe: NoticeDurationRule[];
    ouvrier: NoticeDurationRule[];
  };
};

export type LeaveRules = {
  versionId: string;
  versionCode: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  accrualDaysPerMonth: number;
  seniorityBonusDaysPerMonthAfter5Years: number;
  seniorityBonusDays: number;
  seniorityBonusEveryYears: number;
  maxAnnualDays: number;
  carryoverLimitDays: number;
};

export type SmigRules = {
  versionId: string;
  versionCode: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  smigHourlyMad: number;
  smagDailyMad: number;
  referenceHoursPerMonth: number;
  referenceDaysPerMonth: number;
};

export type OvertimeRules = {
  versionId: string;
  versionCode: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  dayMultiplier: number;
  nightMultiplier: number;
  weekendMultiplier: number;
  holidayMultiplier: number;
  normalDayDaytimeMultiplier: number;
  normalDayNightMultiplier: number;
  restOrHolidayDaytimeMultiplier: number;
  restOrHolidayNightMultiplier: number;
  monthlyReferenceHours: number;
};

export type SocialProtectionRules = {
  versionId: string;
  versionCode: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  sickLeaveWaitingDays: number;
  sickLeaveCnssCoverageRate: number;
  sickLeaveMaxCompensatedDays: number;
  /** Minimum CNSS paid days in last 6 months to be eligible for sick-leave compensation */
  sickLeaveMinCnssEligibilityDays: number;
  maternityCnssCoverageRate: number;
  maternityLegalLeaveWeeks: number;
  /** Minimum CNSS paid months in last 10 months to be eligible for maternity compensation */
  maternityMinCnssMonths: number;
  pensionMinContributionDays: number;
  pensionOpeningContributionDays: number;
  pensionFullContributionDays: number;
  pensionAccrualStepDays: number;
  pensionBaseReplacementRate: number;
  pensionIncrementPerStep: number;
  pensionMaxReplacementRate: number;
  pensionReferenceSalaryCeiling: number;
  pensionNormalRetirementAge: number;
  pensionEarlyRetirementFactor: number;
  workAccidentTemporaryCoverageRate: number;
  workAccidentPermanentCoverageCoefficient: number;
  /** Faute inexcusable (gross negligence) multiplier applied to permanent incapacity rente */
  workAccidentFauteInexcusableMultiplier: number;
};

export type LawRulesBundle = {
  salaryRules: SalaryRules[];
  terminationRules: TerminationRules[];
  leaveRules: LeaveRules[];
  smigRules: SmigRules[];
  overtimeRules: OvertimeRules[];
  socialProtectionRules: SocialProtectionRules[];
};

const DEFAULT_FORCE_MAJEURE_RULES: ForceMajeureRules = {
  preavisDue: false,
  damagesDue: false,
  legalIndemnityDue: false,
  warning:
    "La force majeure est strictement appreciee. Si elle n'est pas reconnue, la rupture peut etre requalifiee.",
};

const DEFAULT_CDI_NOTICE_RULES_BY_CATEGORY: TerminationRules["cdiNoticeRulesByCategory"] = {
  cadre: [
    { minYears: 0, maxYears: 1, value: 1, unit: "month" },
    { minYears: 1, maxYears: 5, value: 2, unit: "month" },
    { minYears: 5, maxYears: null, value: 3, unit: "month" },
  ],
  employe: [
    { minYears: 0, maxYears: 1, value: 8, unit: "day" },
    { minYears: 1, maxYears: 5, value: 1, unit: "month" },
    { minYears: 5, maxYears: null, value: 2, unit: "month" },
  ],
  ouvrier: [
    { minYears: 0, maxYears: 1, value: 8, unit: "day" },
    { minYears: 1, maxYears: 5, value: 1, unit: "month" },
    { minYears: 5, maxYears: null, value: 2, unit: "month" },
  ],
};

export const DEFAULT_SALARY_RULES: SalaryRules[] = [
  {
    versionId: "ma_2025",
    versionCode: "ma_2025",
    effectiveFrom: "2025-01-01",
    effectiveTo: "2025-12-31",
    cnssEmployeeShortTermRate: 0.0052,
    cnssEmployeeLongTermRate: 0.0396,
    cnssEmployeeRate: 0.0448,
    cnssEmployerShortTermRate: 0.0105,
    cnssEmployerLongTermRate: 0.0793,
    cnssEmployerRate: 0.0898,
    cnssCeiling: 6000,
    familyAllowanceEmployerRate: 0.064,
    amoEmployeeRate: 0.0226,
    amoEmployerRate: 0.0411,
    professionalExpenseMode: "legacy_20_percent",
    professionalExpenseRate: 0.2,
    professionalExpenseCap: 2500,
    familyChargeReductionAnnual: 500,
    familyChargeReductionCapAnnual: 3000,
    formationProRateSmall: 0.01,
    formationProRateLarge: 0.016,
    taxBracketsMonthly: [
      { min: 0, max: 3333.33, rate: 0, deduction: 0 },
      { min: 3333.33, max: 5000, rate: 0.1, deduction: 333.33 },
      { min: 5000, max: 6666.67, rate: 0.2, deduction: 833.33 },
      { min: 6666.67, max: 8333.33, rate: 0.3, deduction: 1500 },
      { min: 8333.33, max: 15000, rate: 0.34, deduction: 1833.33 },
      { min: 15000, max: null, rate: 0.37, deduction: 2283.33 },
    ],
  },
  {
    versionId: "ma_2026",
    versionCode: "ma_2026",
    effectiveFrom: "2026-01-01",
    effectiveTo: null,
    cnssEmployeeShortTermRate: 0.0052,
    cnssEmployeeLongTermRate: 0.0396,
    cnssEmployeeRate: 0.0448,
    cnssEmployerShortTermRate: 0.0105,
    cnssEmployerLongTermRate: 0.0793,
    cnssEmployerRate: 0.0898,
    cnssCeiling: 6000,
    familyAllowanceEmployerRate: 0.064,
    amoEmployeeRate: 0.0226,
    amoEmployerRate: 0.0203,
    professionalExpenseMode: "legacy_20_percent",
    professionalExpenseRate: 0.2,
    professionalExpenseCap: 2500,
    familyChargeReductionAnnual: 360,
    familyChargeReductionCapAnnual: 2160,
    formationProRateSmall: 0.016,
    formationProRateLarge: 0.016,
    taxBracketsMonthly: [
      { min: 0, max: 2500, rate: 0, deduction: 0 },
      { min: 2500, max: 4166.67, rate: 0.1, deduction: 250 },
      { min: 4166.67, max: 5000, rate: 0.2, deduction: 666.67 },
      { min: 5000, max: 6666.67, rate: 0.3, deduction: 1166.67 },
      { min: 6666.67, max: 15000, rate: 0.34, deduction: 1433.33 },
      { min: 15000, max: null, rate: 0.38, deduction: 2033.33 },
    ],
  },
];

export const DEFAULT_TERMINATION_RULES: TerminationRules[] = [
  {
    versionId: "ma_2025",
    versionCode: "ma_2025",
    effectiveFrom: "2025-01-01",
    effectiveTo: "2025-12-31",
    tranche1HoursPerYear: 96,
    tranche2HoursPerYear: 144,
    tranche3HoursPerYear: 192,
    tranche4HoursPerYear: 240,
    minimumSeniorityMonthsForLegalIndemnity: 6,
    useFractionalYearsForIndemnity: true,
    referenceHoursPerMonth: 191,
    abusiveBaseMonthsPerYear: 1,
    abusiveCapMonths: 36,
    legalIndemnityContractTypes: ["CDI"],
    cddEarlyTerminationCompensation: "remaining_salary_until_contract_end",
    forceMajeure: DEFAULT_FORCE_MAJEURE_RULES,
    cddNoticeDaysByCategory: {
      cadre: 15,
      employe: 8,
      ouvrier: 8,
    },
    cdiNoticeMonthsByCategory: {
      cadre: { lt1: 1, gte1lt5: 2, gte5: 3 },
      employe: { lt1: 0.27, gte1lt5: 1, gte5: 2 },
      ouvrier: { lt1: 0.27, gte1lt5: 1, gte5: 2 },
    },
    cdiNoticeRulesByCategory: DEFAULT_CDI_NOTICE_RULES_BY_CATEGORY,
  },
  {
    versionId: "ma_2026",
    versionCode: "ma_2026",
    effectiveFrom: "2026-01-01",
    effectiveTo: null,
    tranche1HoursPerYear: 96,
    tranche2HoursPerYear: 144,
    tranche3HoursPerYear: 192,
    tranche4HoursPerYear: 240,
    minimumSeniorityMonthsForLegalIndemnity: 6,
    useFractionalYearsForIndemnity: true,
    referenceHoursPerMonth: 191,
    abusiveBaseMonthsPerYear: 1,
    abusiveCapMonths: 36,
    legalIndemnityContractTypes: ["CDI"],
    cddEarlyTerminationCompensation: "remaining_salary_until_contract_end",
    forceMajeure: DEFAULT_FORCE_MAJEURE_RULES,
    cddNoticeDaysByCategory: {
      cadre: 15,
      employe: 8,
      ouvrier: 8,
    },
    cdiNoticeMonthsByCategory: {
      cadre: { lt1: 1, gte1lt5: 2, gte5: 3 },
      employe: { lt1: 0.27, gte1lt5: 1, gte5: 2 },
      ouvrier: { lt1: 0.27, gte1lt5: 1, gte5: 2 },
    },
    cdiNoticeRulesByCategory: DEFAULT_CDI_NOTICE_RULES_BY_CATEGORY,
  },
];

export const DEFAULT_LEAVE_RULES: LeaveRules[] = [
  {
    versionId: "ma_2025",
    versionCode: "ma_2025",
    effectiveFrom: "2025-01-01",
    effectiveTo: "2025-12-31",
    accrualDaysPerMonth: 1.5,
    seniorityBonusDaysPerMonthAfter5Years: 0.08,
    seniorityBonusDays: 1.5,
    seniorityBonusEveryYears: 5,
    maxAnnualDays: 30,
    carryoverLimitDays: 45,
  },
  {
    versionId: "ma_2026",
    versionCode: "ma_2026",
    effectiveFrom: "2026-01-01",
    effectiveTo: null,
    accrualDaysPerMonth: 1.5,
    seniorityBonusDaysPerMonthAfter5Years: 0.08,
    seniorityBonusDays: 1.5,
    seniorityBonusEveryYears: 5,
    maxAnnualDays: 30,
    carryoverLimitDays: 45,
  },
];

export const DEFAULT_SMIG_RULES: SmigRules[] = [
  {
    versionId: "ma_2025",
    versionCode: "ma_2025",
    effectiveFrom: "2025-01-01",
    effectiveTo: "2025-12-31",
    smigHourlyMad: 16.29,
    smagDailyMad: 88.58,
    referenceHoursPerMonth: 191,
    referenceDaysPerMonth: 26,
  },
  {
    versionId: "ma_2026",
    versionCode: "ma_2026",
    effectiveFrom: "2026-01-01",
    effectiveTo: "2026-03-31",
    smigHourlyMad: 17.92,
    smagDailyMad: 88.58,
    referenceHoursPerMonth: 191,
    referenceDaysPerMonth: 26,
  },
  {
    versionId: "ma_2026_q2",
    versionCode: "ma_2026",
    effectiveFrom: "2026-04-01",
    effectiveTo: null,
    smigHourlyMad: 17.92,
    smagDailyMad: 97.44,
    referenceHoursPerMonth: 191,
    referenceDaysPerMonth: 26,
  },
];

export const DEFAULT_OVERTIME_RULES: OvertimeRules[] = [
  {
    versionId: "ma_2025",
    versionCode: "ma_2025",
    effectiveFrom: "2025-01-01",
    effectiveTo: "2025-12-31",
    dayMultiplier: 1.25,
    nightMultiplier: 1.5,
    weekendMultiplier: 1.5,
    holidayMultiplier: 2,
    normalDayDaytimeMultiplier: 1.25,
    normalDayNightMultiplier: 1.5,
    restOrHolidayDaytimeMultiplier: 1.5,
    restOrHolidayNightMultiplier: 2,
    monthlyReferenceHours: 191,
  },
  {
    versionId: "ma_2026",
    versionCode: "ma_2026",
    effectiveFrom: "2026-01-01",
    effectiveTo: null,
    dayMultiplier: 1.25,
    nightMultiplier: 1.5,
    weekendMultiplier: 1.5,
    holidayMultiplier: 2,
    normalDayDaytimeMultiplier: 1.25,
    normalDayNightMultiplier: 1.5,
    restOrHolidayDaytimeMultiplier: 1.5,
    restOrHolidayNightMultiplier: 2,
    monthlyReferenceHours: 191,
  },
];

export const DEFAULT_SOCIAL_PROTECTION_RULES: SocialProtectionRules[] = [
  {
    versionId: "ma_2025",
    versionCode: "ma_2025",
    effectiveFrom: "2025-01-01",
    effectiveTo: "2025-12-31",
    sickLeaveWaitingDays: 3,
    sickLeaveCnssCoverageRate: 2 / 3,
    sickLeaveMaxCompensatedDays: 365,
    sickLeaveMinCnssEligibilityDays: 54,
    maternityCnssCoverageRate: 1,
    maternityLegalLeaveWeeks: 14,
    maternityMinCnssMonths: 3,
    pensionMinContributionDays: 1320,
    pensionOpeningContributionDays: 1320,
    pensionFullContributionDays: 3240,
    pensionAccrualStepDays: 216,
    pensionBaseReplacementRate: 0.5,
    pensionIncrementPerStep: 0.01,
    pensionMaxReplacementRate: 0.7,
    pensionReferenceSalaryCeiling: 6000,
    pensionNormalRetirementAge: 60,
    pensionEarlyRetirementFactor: 0.9,
    workAccidentTemporaryCoverageRate: 2 / 3,
    workAccidentPermanentCoverageCoefficient: 0.5,
    workAccidentFauteInexcusableMultiplier: 2,
  },
  {
    versionId: "ma_2026",
    versionCode: "ma_2026",
    effectiveFrom: "2026-01-01",
    effectiveTo: null,
    sickLeaveWaitingDays: 3,
    sickLeaveCnssCoverageRate: 2 / 3,
    sickLeaveMaxCompensatedDays: 365,
    sickLeaveMinCnssEligibilityDays: 54,
    maternityCnssCoverageRate: 1,
    maternityLegalLeaveWeeks: 14,
    maternityMinCnssMonths: 3,
    pensionMinContributionDays: 1320,
    pensionOpeningContributionDays: 1320,
    pensionFullContributionDays: 3240,
    pensionAccrualStepDays: 216,
    pensionBaseReplacementRate: 0.5,
    pensionIncrementPerStep: 0.01,
    pensionMaxReplacementRate: 0.7,
    pensionReferenceSalaryCeiling: 6000,
    pensionNormalRetirementAge: 60,
    pensionEarlyRetirementFactor: 0.9,
    workAccidentTemporaryCoverageRate: 2 / 3,
    workAccidentPermanentCoverageCoefficient: 0.5,
    workAccidentFauteInexcusableMultiplier: 2,
  },
];

function pickRulesByDate<T extends { effectiveFrom: string; effectiveTo: string | null }>(
  dateISO: string,
  rules: T[],
): T {
  const target = new Date(dateISO);
  const match = rules.find((rule) => {
    const start = new Date(rule.effectiveFrom);
    const end = rule.effectiveTo ? new Date(rule.effectiveTo) : null;
    return target >= start && (!end || target <= end);
  });

  return match ?? rules[rules.length - 1];
}

const LAW_RULES_PATH = path.join(process.cwd(), "data", "law-rules.json");
let cachedRuntimeRules: Partial<LawRulesBundle> | null | undefined;
let cachedResolvedBundle: LawRulesBundle | null = null;

function readRuntimeRules(): Partial<LawRulesBundle> | null {
  if (cachedRuntimeRules !== undefined) {
    return cachedRuntimeRules;
  }
  try {
    if (!fs.existsSync(LAW_RULES_PATH)) {
      cachedRuntimeRules = null;
      return cachedRuntimeRules;
    }
    const raw = fs.readFileSync(LAW_RULES_PATH, "utf8");
    cachedRuntimeRules = JSON.parse(raw) as Partial<LawRulesBundle>;
    return cachedRuntimeRules;
  } catch {
    cachedRuntimeRules = null;
    return cachedRuntimeRules;
  }
}

function resolveRuleSet<T>(runtimeRules: Partial<LawRulesBundle> | null, key: keyof LawRulesBundle, fallback: T[]): T[] {
  const runtime = runtimeRules?.[key];
  if (!Array.isArray(runtime) || runtime.length === 0) {
    return fallback;
  }
  return runtime as T[];
}

function getResolvedBundle(): LawRulesBundle {
  if (cachedResolvedBundle) {
    return cachedResolvedBundle;
  }
  const runtimeRules = readRuntimeRules();
  cachedResolvedBundle = {
    salaryRules: resolveRuleSet<SalaryRules>(runtimeRules, "salaryRules", DEFAULT_SALARY_RULES),
    terminationRules: resolveRuleSet<TerminationRules>(runtimeRules, "terminationRules", DEFAULT_TERMINATION_RULES),
    leaveRules: resolveRuleSet<LeaveRules>(runtimeRules, "leaveRules", DEFAULT_LEAVE_RULES),
    smigRules: resolveRuleSet<SmigRules>(runtimeRules, "smigRules", DEFAULT_SMIG_RULES),
    overtimeRules: resolveRuleSet<OvertimeRules>(runtimeRules, "overtimeRules", DEFAULT_OVERTIME_RULES),
    socialProtectionRules: resolveRuleSet<SocialProtectionRules>(
      runtimeRules,
      "socialProtectionRules",
      DEFAULT_SOCIAL_PROTECTION_RULES,
    ),
  };
  return cachedResolvedBundle;
}

export function invalidateRulesCache() {
  cachedRuntimeRules = undefined;
  cachedResolvedBundle = null;
}

export function getDefaultRulesBundle(): LawRulesBundle {
  return {
    salaryRules: DEFAULT_SALARY_RULES,
    terminationRules: DEFAULT_TERMINATION_RULES,
    leaveRules: DEFAULT_LEAVE_RULES,
    smigRules: DEFAULT_SMIG_RULES,
    overtimeRules: DEFAULT_OVERTIME_RULES,
    socialProtectionRules: DEFAULT_SOCIAL_PROTECTION_RULES,
  };
}

export function getRulesBundle(): LawRulesBundle {
  return getResolvedBundle();
}

export function getSalaryRulesByDate(dateISO: string): SalaryRules {
  return pickRulesByDate(dateISO, getResolvedBundle().salaryRules);
}

export function getTerminationRulesByDate(dateISO: string): TerminationRules {
  return pickRulesByDate(dateISO, getResolvedBundle().terminationRules);
}

export function getLeaveRulesByDate(dateISO: string): LeaveRules {
  return pickRulesByDate(dateISO, getResolvedBundle().leaveRules);
}

export function getSmigRulesByDate(dateISO: string): SmigRules {
  return pickRulesByDate(dateISO, getResolvedBundle().smigRules);
}

export function getOvertimeRulesByDate(dateISO: string): OvertimeRules {
  return pickRulesByDate(dateISO, getResolvedBundle().overtimeRules);
}

export function getSocialProtectionRulesByDate(dateISO: string): SocialProtectionRules {
  return pickRulesByDate(dateISO, getResolvedBundle().socialProtectionRules);
}
