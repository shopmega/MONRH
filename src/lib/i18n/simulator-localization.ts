import type { AppLanguage } from "@/lib/i18n/messages";

const CALCULATOR_META_AR: Record<string, { title: string; description: string }> = {
  net_gross: {
    title: "الأجر الصافي / الإجمالي",
    description: "نتيجة مفصلة تشمل الاقتطاعات الاجتماعية والضريبة وكلفة المشغل.",
  },
  employer_total_cost: {
    title: "الكلفة الإجمالية للمشغل",
    description: "تقدير الكلفة الشهرية الإجمالية على الشركة.",
  },
  annual_income_tax: {
    title: "الضريبة السنوية على الدخل",
    description: "محاكاة سنوية للضريبة مع المنح والشهر 13.",
  },
  licenciement: {
    title: "تعويض الفصل",
    description: "تقدير التعويض القانوني والإشعار والعطل المتبقية والإجمالي.",
  },
  demission: {
    title: "سيناريو الاستقالة",
    description: "تقدير الأثر المالي للاستقالة.",
  },
  fin_cdd: {
    title: "نهاية عقد CDD",
    description: "حساب منحة الهشاشة والعطل المتبقية وتعويض الإشعار.",
  },
  probation_termination: {
    title: "إنهاء فترة التجربة",
    description: "التحقق من الإشعار والتعويض المحتمل.",
  },
  seniority_growth: {
    title: "تطور الأقدمية",
    description: "مقارنة التعويض المحتمل الحالي مقابل بعد سنوات إضافية.",
  },
  leave_accrual: {
    title: "العطل المكتسبة",
    description: "احسب الأيام المكتسبة والرصد المتبقي وتأثير الأقدمية.",
  },
  overtime: {
    title: "الساعات الإضافية",
    description: "احسب زيادات ساعات النهار والليل والويكند والأعياد.",
  },
  public_holiday_compensation: {
    title: "العمل يوم عطلة",
    description: "تقدير التعويض عن الساعات المنجزة في يوم عطلة.",
  },
  maternity_leave: {
    title: "عطلة الأمومة",
    description: "توقع الدخل خلال عطلة الأمومة (CNSS + تكملة المشغل).",
  },
  sick_leave: {
    title: "التوقف المرضي",
    description: "تقدير تعويض CNSS وفقدان الدخل.",
  },
  cnss_pension: {
    title: "توقع معاش CNSS",
    description: "تقدير مبسط للمعاش الشهري حسب متوسط الأجر وسنوات الاشتراك.",
  },
  work_accident: {
    title: "حادثة الشغل",
    description: "تقدير التعويض المؤقت والدائم.",
  },
  harassment_scenario: {
    title: "سيناريو التحرش",
    description: "تقييم جاهزية الملف ومستوى التصعيد المقترح.",
  },
  unpaid_salary_recovery: {
    title: "تحصيل الأجر غير المؤدى",
    description: "تقدير المبلغ الأصلي وغرامات التأخير وإجمالي المطالبة.",
  },
  unpaid_overtime_recovery: {
    title: "تحصيل الساعات الإضافية غير المؤداة",
    description: "تقدير مستحقات الساعات الإضافية وغرامات التأخير.",
  },
  smig_compliance: {
    title: "مطابقة SMIG / SMAG",
    description: "تحقق مما إذا كان الأجر المدخل يحترم الحد الأدنى القانوني.",
  },
};

const FIELD_LABEL_AR: Record<string, string> = {
  direction: "الاتجاه",
  amount: "المبلغ (درهم)",
  calculationDate: "تاريخ الحساب",
  includeCimr: "إدراج CIMR (6%)",
  grossSalary: "الأجر الإجمالي (درهم)",
  insuranceRate: "نسبة تأمين المشغل",
  monthlySalary: "الأجر الشهري (درهم)",
  paidMonths: "الأشهر المؤدى عنها",
  bonusAmount: "منحة سنوية (درهم)",
  include13thSalary: "إدراج الشهر 13",
  yearsOfService: "الأقدمية (سنوات)",
  monthsOfService: "أشهر إضافية",
  unusedLeaveDays: "العطل المتبقية (أيام)",
  abusive: "فصل تعسفي (تقدير تعويض)",
  noticeServed: "تم تنفيذ الإشعار",
  contractMonths: "مدة العقد (أشهر)",
  precariteApplicable: "منحة الهشاشة مطبقة",
  noticeDays: "أيام الإشعار المعوضة",
  workedDays: "أيام العمل خلال التجربة",
  initiator: "الطرف المبادر بالإنهاء",
  noticeDaysGiven: "أيام الإشعار الممنوحة",
  additionalYears: "سنوات إضافية",
  monthsWorked: "أشهر العمل",
  seniorityYears: "الأقدمية (سنوات)",
  usedLeaveDays: "العطل المستهلكة (أيام)",
  carriedDays: "الرصيد المرحل (أيام)",
  salaryType: "نوع الحد الأدنى",
  currentSalaryMad: "الأجر الشهري الحالي (درهم)",
  overtimeDayHours: "ساعات إضافية نهارية",
  overtimeNightHours: "ساعات إضافية ليلية",
  overtimeWeekendHours: "ساعات إضافية في الويكند",
  overtimeHolidayHours: "ساعات إضافية في يوم عطلة",
  holidayHoursWorked: "ساعات العمل (يوم عطلة)",
  alreadyPaidNormalDay: "اليوم العادي مؤدى مسبقا",
  leaveWeeks: "مدة العطلة (أسابيع)",
  cnssCoverageRate: "نسبة تغطية CNSS",
  employerTopUp: "تكملة المشغل",
  sickDays: "أيام التوقف المرضي",
  waitingDays: "أيام الانتظار",
  averageSalary: "متوسط الأجر (درهم)",
  contributionYears: "سنوات الاشتراك",
  retirementAge: "سن التقاعد",
  temporaryIncapacityDays: "أيام العجز المؤقت",
  permanentIncapacityPercent: "نسبة العجز الدائم (%)",
  incidentsCount: "عدد الوقائع الموثقة",
  witnessesCount: "عدد الشهود",
  hasWrittenProof: "توفر أدلة كتابية",
  hasMedicalProof: "توفر وثائق طبية",
  unpaidMonths: "أشهر غير مؤداة",
  delayMonths: "أشهر التأخير",
  penaltyRatePerMonth: "نسبة غرامة شهرية",
  unpaidDayHours: "ساعات نهارية غير مؤداة",
  unpaidNightHours: "ساعات ليلية غير مؤداة",
  unpaidWeekendHours: "ساعات ويكند غير مؤداة",
  unpaidHolidayHours: "ساعات يوم عطلة غير مؤداة",
};

const OPTION_LABEL_AR: Record<string, string> = {
  gross_to_net: "من الإجمالي إلى الصافي",
  net_to_gross: "من الصافي إلى الإجمالي",
  employer: "المشغل",
  employee: "الأجير",
  smig: "SMIG",
  smag: "SMAG",
};

const BREAKDOWN_LABEL_AR: Record<string, string> = {
  gross: "الإجمالي",
  net: "الصافي",
  taxableIncome: "الدخل الخاضع للضريبة",
  cnssEmployee: "CNSS الأجير",
  cnssEmployer: "CNSS المشغل",
  amoEmployee: "AMO الأجير",
  amoEmployer: "AMO المشغل",
  cimrEmployee: "CIMR الأجير",
  incomeTax: "الضريبة على الدخل",
  professionalExpenseDeduction: "خصم المصاريف المهنية",
  employerTotalCost: "كلفة المشغل",
  contractGrossAmount: "إجمالي العقد",
  primePrecarite: "منحة الهشاشة",
  leavePayout: "تعويض العطل",
  noticeCompensation: "تعويض الإشعار",
  totalEndOfContractAmount: "إجمالي نهاية العقد",
  annualGrossIncome: "الإجمالي السنوي",
  annualProfessionalDeduction: "الخصم المهني",
  annualSocialContributions: "الاقتطاعات الاجتماعية",
  annualTaxableIncome: "الدخل السنوي الخاضع للضريبة",
  annualIncomeTax: "الضريبة السنوية",
  monthlyAverageTax: "متوسط الضريبة الشهرية",
  effectiveTaxRatePercent: "النسبة الفعلية",
  totalServiceYears: "الأقدمية",
  indemnityLegale: "التعويض القانوني",
  indemnitePreavis: "تعويض الإشعار",
  congesPayesRestants: "العطل المتبقية",
  dommagesAbusif: "تعويض الفصل التعسفي",
  totalEstimated: "الإجمالي التقديري",
  requiredNoticeMonths: "مدة الإشعار المطلوبة",
  noticeCompensationDue: "تعويض الإشعار المستحق",
  netFinancialOutcome: "النتيجة الصافية",
  requiredNoticeDays: "أيام الإشعار المطلوبة",
  noticeDaysGiven: "أيام الإشعار الممنوحة",
  missingNoticeDays: "الأيام الناقصة",
  compensationDue: "التعويض المستحق",
  accrualDays: "الأيام المكتسبة",
  seniorityBonusDays: "مكافأة الأقدمية",
  totalAvailableDays: "الإجمالي المتاح",
  remainingDays: "المتبقي",
  carryoverAfterLimit: "القابل للترحيل",
  baseHourlyRate: "الأجر الساعي الأساسي",
  dayAmount: "مبلغ النهار",
  nightAmount: "مبلغ الليل",
  weekendAmount: "مبلغ الويكند",
  holidayAmount: "مبلغ يوم العطلة",
  totalOvertimeAmount: "إجمالي الساعات الإضافية",
  multiplierApplied: "المعامل المطبق",
  compensationAmount: "التعويض التقديري",
  leaveMonthsEquivalent: "المكافئ بالأشهر",
  cnssCompensation: "تعويض CNSS",
  employerTopUpAmount: "تكملة المشغل",
  totalEstimatedIncome: "إجمالي الدخل التقديري",
  paidDaysByCnss: "الأيام المعوضة",
  grossIncomeEquivalent: "المكافئ الإجمالي",
  estimatedIncomeLoss: "فقدان الدخل التقديري",
  replacementRatePercent: "نسبة التعويض",
  estimatedMonthlyPension: "المعاش الشهري",
  estimatedAnnualPension: "المعاش السنوي",
  salaryType: "النوع",
  currentSalaryMad: "الأجر الحالي",
  minimumRequiredMad: "الحد الأدنى المطلوب",
  gapMad: "الفارق",
  compliant: "مطابق",
  currentIndemnityEstimate: "التعويض الحالي",
  futureIndemnityEstimate: "التعويض المستقبلي",
  growthAmount: "الزيادة التقديرية",
  growthPercent: "نسبة الزيادة",
  temporaryCompensation: "تعويض مؤقت",
  monthlyPermanentCompensation: "معاش شهري",
  annualPermanentCompensation: "معاش سنوي",
  totalFirstYearEstimate: "إجمالي السنة الأولى",
  dossierStrengthScore: "قوة الملف",
  recommendedEscalationLevel: "مستوى التصعيد المقترح",
  evidenceReadinessPercent: "جاهزية الأدلة",
  principalAmount: "المبلغ الأصلي",
  delayPenalties: "غرامات التأخير",
  totalClaimAmount: "إجمالي المطالبة",
  overtimePrincipal: "الأصل: الساعات الإضافية",
};

export function localizeCalculatorTitle(
  calculatorType: string,
  title: string,
  language: AppLanguage,
) {
  if (language !== "ar") return title;
  return CALCULATOR_META_AR[calculatorType]?.title ?? title;
}

export function localizeCalculatorDescription(
  calculatorType: string,
  description: string,
  language: AppLanguage,
) {
  if (language !== "ar") return description;
  return CALCULATOR_META_AR[calculatorType]?.description ?? description;
}

export function localizeFieldLabel(fieldKey: string, fallback: string, language: AppLanguage) {
  if (language !== "ar") return fallback;
  return FIELD_LABEL_AR[fieldKey] ?? fallback;
}

export function localizeOptionLabel(optionValue: string, fallback: string, language: AppLanguage) {
  if (language !== "ar") return fallback;
  return OPTION_LABEL_AR[optionValue] ?? fallback;
}

export function localizeBreakdownLabel(breakdownKey: string, fallback: string, language: AppLanguage) {
  if (language !== "ar") return fallback;
  return BREAKDOWN_LABEL_AR[breakdownKey] ?? fallback;
}
