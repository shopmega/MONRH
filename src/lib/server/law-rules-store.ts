import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { getSupabaseAdminClient } from "@/lib/server/supabase-admin";
import {
  getDefaultRulesBundle,
  invalidateRulesCache,
  type LawRulesBundle,
} from "@/lib/rules/default-rules";

const DATA_DIR = path.join(process.cwd(), "data");
const RULES_PATH = path.join(DATA_DIR, "law-rules.json");
const SETTINGS_KEY = "law_rules_bundle";

const taxBracketSchema = z.object({
  min: z.number(),
  max: z.number().nullable(),
  rate: z.number().min(0),
  deduction: z.number().min(0).optional(),
});

const professionalExpenseTierSchema = z.object({
  maxGrossMonthly: z.number().min(0).nullable(),
  rate: z.number().min(0),
  monthlyCap: z.number().min(0),
});

const baseVersionSchema = z.object({
  versionId: z.string().min(1),
  versionCode: z.string().min(1),
  effectiveFrom: z.string().min(1),
  effectiveTo: z.string().nullable(),
});

const salaryRuleSchema = baseVersionSchema.extend({
  cnssEmployeeRate: z.number().min(0),
  cnssEmployerRate: z.number().min(0),
  cnssCeiling: z.number().min(0),
  familyAllowanceEmployerRate: z.number().min(0).default(0.064),
  amoEmployeeRate: z.number().min(0),
  amoEmployerRate: z.number().min(0),
  professionalExpenseMode: z.enum(["legacy_20_percent", "reform_35_25_percent"]).default("legacy_20_percent"),
  professionalExpenseRate: z.number().min(0),
  professionalExpenseCap: z.number().min(0),
  professionalExpenseTiers: z.array(professionalExpenseTierSchema).optional(),
  familyChargeReductionAnnual: z.number().min(0),
  familyChargeReductionCapAnnual: z.number().min(0),
  formationProRateSmall: z.number().min(0),
  formationProRateLarge: z.number().min(0),
  taxBracketsMonthly: z.array(taxBracketSchema).min(1),
});

const noticeDurationRuleSchema = z.object({
  minYears: z.number().min(0),
  maxYears: z.number().min(0).nullable(),
  value: z.number().min(0),
  unit: z.enum(["day", "month"]),
});

const forceMajeureSchema = z.object({
  preavisDue: z.boolean(),
  damagesDue: z.boolean(),
  legalIndemnityDue: z.boolean(),
  warning: z.string().min(1),
});

const terminationRuleSchema = baseVersionSchema.extend({
  tranche1HoursPerYear: z.number().min(0),
  tranche2HoursPerYear: z.number().min(0),
  tranche3HoursPerYear: z.number().min(0),
  tranche4HoursPerYear: z.number().min(0),
  minimumSeniorityMonthsForLegalIndemnity: z.number().min(0).default(6),
  useFractionalYearsForIndemnity: z.boolean().default(true),
  referenceHoursPerMonth: z.number().min(1).default(191),
  abusiveBaseMonthsPerYear: z.number().min(0),
  abusiveCapMonths: z.number().min(0),
  legalIndemnityContractTypes: z.array(z.enum(["CDI", "CDD"])).min(1),
  cddEarlyTerminationCompensation: z.literal("remaining_salary_until_contract_end").default("remaining_salary_until_contract_end"),
  forceMajeure: forceMajeureSchema.default({
    preavisDue: false,
    damagesDue: false,
    legalIndemnityDue: false,
    warning:
      "La force majeure est strictement appreciee. Si elle n'est pas reconnue, la rupture peut etre requalifiee.",
  }),
  cddNoticeDaysByCategory: z.object({
    cadre: z.number().min(0),
    employe: z.number().min(0),
    ouvrier: z.number().min(0),
  }),
  cdiNoticeMonthsByCategory: z.object({
    cadre: z.object({ lt1: z.number().min(0), gte1lt5: z.number().min(0), gte5: z.number().min(0) }),
    employe: z.object({ lt1: z.number().min(0), gte1lt5: z.number().min(0), gte5: z.number().min(0) }),
    ouvrier: z.object({ lt1: z.number().min(0), gte1lt5: z.number().min(0), gte5: z.number().min(0) }),
  }),
  cdiNoticeRulesByCategory: z
    .object({
      cadre: z.array(noticeDurationRuleSchema).min(1),
      employe: z.array(noticeDurationRuleSchema).min(1),
      ouvrier: z.array(noticeDurationRuleSchema).min(1),
    })
    .default({
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
    }),
});

const leaveRuleSchema = baseVersionSchema.extend({
  accrualDaysPerMonth: z.number().min(0),
  seniorityBonusDaysPerMonthAfter5Years: z.number().min(0),
  seniorityBonusDays: z.number().min(0).default(1.5),
  seniorityBonusEveryYears: z.number().min(1).default(5),
  maxAnnualDays: z.number().min(0).default(30),
  carryoverLimitDays: z.number().min(0),
});

const smigRuleSchema = baseVersionSchema.extend({
  smigHourlyMad: z.number().min(0),
  smagDailyMad: z.number().min(0),
  referenceHoursPerMonth: z.number().min(0),
  referenceDaysPerMonth: z.number().min(0),
});

const overtimeRuleSchema = baseVersionSchema.extend({
  dayMultiplier: z.number().min(0),
  nightMultiplier: z.number().min(0),
  weekendMultiplier: z.number().min(0),
  holidayMultiplier: z.number().min(0),
  normalDayDaytimeMultiplier: z.number().min(0).default(1.25),
  normalDayNightMultiplier: z.number().min(0).default(1.5),
  restOrHolidayDaytimeMultiplier: z.number().min(0).default(1.5),
  restOrHolidayNightMultiplier: z.number().min(0).default(2),
  monthlyReferenceHours: z.number().min(0),
});

const socialProtectionRuleSchema = baseVersionSchema.extend({
  sickLeaveWaitingDays: z.number().min(0),
  sickLeaveCnssCoverageRate: z.number().min(0),
  sickLeaveMaxCompensatedDays: z.number().min(0),
  sickLeaveMinCnssEligibilityDays: z.number().min(0),
  maternityCnssCoverageRate: z.number().min(0),
  maternityLegalLeaveWeeks: z.number().min(0),
  maternityMinCnssMonths: z.number().min(0),
  pensionMinContributionDays: z.number().min(0),
  pensionOpeningContributionDays: z.number().min(0),
  pensionFullContributionDays: z.number().min(0),
  pensionAccrualStepDays: z.number().min(1),
  pensionBaseReplacementRate: z.number().min(0),
  pensionIncrementPerStep: z.number().min(0),
  pensionMaxReplacementRate: z.number().min(0),
  pensionReferenceSalaryCeiling: z.number().min(0),
  pensionNormalRetirementAge: z.number().min(0),
  pensionEarlyRetirementFactor: z.number().min(0),
  workAccidentTemporaryCoverageRate: z.number().min(0),
  workAccidentPermanentCoverageCoefficient: z.number().min(0),
  workAccidentFauteInexcusableMultiplier: z.number().min(0),
});

export const lawRulesBundleSchema = z.object({
  salaryRules: z.array(salaryRuleSchema).min(1),
  terminationRules: z.array(terminationRuleSchema).min(1),
  leaveRules: z.array(leaveRuleSchema).min(1),
  smigRules: z.array(smigRuleSchema).min(1),
  overtimeRules: z.array(overtimeRuleSchema).min(1),
  socialProtectionRules: z.array(socialProtectionRuleSchema).min(1),
});

async function ensureRulesFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(RULES_PATH);
  } catch {
    const defaults = getDefaultRulesBundle();
    await fs.writeFile(RULES_PATH, JSON.stringify(defaults, null, 2), "utf8");
  }
}

async function readRulesFromSupabase(): Promise<LawRulesBundle | null> {
  try {
    const appSettings = getSupabaseAdminClient().from("app_settings") as unknown as {
      select: (
        columns: string,
      ) => {
        eq: (column: string, value: string) => {
          maybeSingle: () => Promise<{
            data: { value?: unknown } | null;
            error: unknown;
          }>;
        };
      };
    };
    const { data, error } = await appSettings
      .select("value")
      .eq("key", SETTINGS_KEY)
      .maybeSingle();
    if (error) return null;
    if (!data) return getDefaultRulesBundle();
    const row = data as { value?: unknown };
    return lawRulesBundleSchema.parse((row.value ?? {}) as unknown);
  } catch {
    return null;
  }
}

async function writeRulesToSupabase(bundle: LawRulesBundle): Promise<boolean> {
  try {
    const appSettings = getSupabaseAdminClient().from("app_settings") as unknown as {
      upsert: (
        values: { key: string; value: unknown; updated_at: string },
        options: { onConflict: string },
      ) => Promise<{ error: unknown }>;
    };
    const { error } = await appSettings
      .upsert(
        {
          key: SETTINGS_KEY,
          value: bundle,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" },
      );
    return !error;
  } catch {
    return false;
  }
}

export async function readLawRulesBundle(): Promise<LawRulesBundle> {
  const supabaseRules = await readRulesFromSupabase();
  if (supabaseRules) return supabaseRules;

  await ensureRulesFile();
  const raw = await fs.readFile(RULES_PATH, "utf8");
  try {
    return lawRulesBundleSchema.parse(JSON.parse(raw));
  } catch {
    return getDefaultRulesBundle();
  }
}

export async function writeLawRulesBundle(payload: unknown): Promise<LawRulesBundle> {
  const parsed = lawRulesBundleSchema.parse(payload);
  const persisted = await writeRulesToSupabase(parsed);
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(RULES_PATH, JSON.stringify(parsed, null, 2), "utf8");
  } catch (error) {
    if (!persisted) {
      throw error;
    }
  }
  invalidateRulesCache();
  if (persisted) {
    return parsed;
  }
  return parsed;
}
