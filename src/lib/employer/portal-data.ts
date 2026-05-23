import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  Building2,
  BrainCircuit,
  CalendarClock,
  ChartNoAxesCombined,
  ClipboardList,
  Download,
  FileText,
  Lock,
  Mail,
  ShieldCheck,
  Timer,
  Users,
} from "lucide-react";

export type EmployerPlan = "free" | "pro" | "cabinet";
export type EmployerActionStatus = "ready" | "foundation" | "planned";

export type EmployerAction = {
  title: string;
  description: string;
  phase: "Phase 1" | "Phase 2" | "Phase 3";
  impact: "Impact fort" | "Impact moyen" | "Moat";
  status: EmployerActionStatus;
  href?: string;
  icon: LucideIcon;
};

export type EmployerMetric = {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
};

export type EmployerSaasModule = {
  id:
    | "people"
    | "payroll"
    | "time"
    | "self-service"
    | "compliance"
    | "pilotage";
  title: string;
  scope: string;
  description: string;
  href: string;
  links: { label: string; href: string }[];
  icon: LucideIcon;
};

export type EmployerEmployee = {
  id: string;
  employeeNumber?: string;
  fullName: string;
  cin?: string;
  role: string;
  contractType: "CDI" | "CDD" | "Stage" | "Interim";
  startDate: string;
  endDate?: string;
  grossSalary: number;
  cnssNumber: string;
  childrenCount?: number;
  email?: string;
  documents?: EmployerEmployeeDocument[];
  status: "Actif" | "Suspendu" | "Sorti";
};

export type EmployerEmployeeDocumentType = "contract" | "cin" | "cnss" | "rib" | "medical";

export type EmployerEmployeeDocument = {
  type: EmployerEmployeeDocumentType;
  label: string;
  attached: boolean;
  updatedAt?: string;
};

export type EmployerLeaveStatus = "pending" | "approved" | "rejected";
export type EmployerLeaveType = "paid" | "sick" | "unpaid" | "exceptional";

export type EmployerLeaveRequest = {
  id: string;
  employeeId: string;
  employeeName: string;
  type: EmployerLeaveType;
  startDate: string;
  endDate: string;
  days: number;
  status: EmployerLeaveStatus;
  reason: string;
  createdAt: string;
  decidedAt?: string;
};

export type EmployerTimeEntryStatus = "draft" | "approved" | "rejected";

export type EmployerTimeEntry = {
  id: string;
  employeeId: string;
  employeeName: string;
  weekStart: string;
  regularHours: number;
  overtimeDayHours: number;
  overtimeNightHours: number;
  overtimeRestOrHolidayDayHours: number;
  overtimeRestOrHolidayNightHours: number;
  overtimeAmount: number;
  status: EmployerTimeEntryStatus;
  note: string;
  createdAt: string;
  decidedAt?: string;
};

export type EmployerCompany = {
  id: string;
  name: string;
  ice: string;
  cnssAffiliateNumber: string;
  city: string;
  plan: EmployerPlan;
};

export const EMPLOYER_EMPLOYEE_STORAGE_KEY = "monrh_employer_employees_v1";
export const EMPLOYER_PAYROLL_RUN_STORAGE_KEY = "monrh_employer_payroll_runs_v1";
export const EMPLOYER_COMPANY_STORAGE_KEY = "monrh_employer_companies_v1";
export const EMPLOYER_ACTIVE_COMPANY_STORAGE_KEY = "monrh_employer_active_company_v1";
export const EMPLOYER_LEAVE_REQUEST_STORAGE_KEY = "monrh_employer_leave_requests_v1";
export const EMPLOYER_COMPLIANCE_DISMISSED_STORAGE_KEY = "monrh_employer_compliance_dismissed_v1";
export const EMPLOYER_TIME_ENTRY_STORAGE_KEY = "monrh_employer_time_entries_v1";
export const EMPLOYER_CNSS_EXPORT_STORAGE_KEY = "monrh_employer_cnss_exports_v1";
export const EMPLOYER_CONTRACT_RECORD_STORAGE_KEY = "monrh_employer_contract_records_v1";
export const EMPLOYEE_ACTIVE_PROFILE_STORAGE_KEY = "monrh_employee_active_profile_v1";
export const EMPLOYER_CONTRACT_DRAFT_STORAGE_KEY = "contract_draft";

export const employerPlanLabels: Record<EmployerPlan, string> = {
  free: "Free",
  pro: "Pro",
  cabinet: "Cabinet RH",
};

export const employerPlanCapabilities: Record<
  EmployerPlan,
  {
    maxCompanies: number;
    maxEmployees: number;
    canExportCsv: boolean;
    canDownloadPayslips: boolean;
    canWhiteLabel: boolean;
  }
> = {
  free: {
    maxCompanies: 1,
    maxEmployees: 5,
    canExportCsv: false,
    canDownloadPayslips: false,
    canWhiteLabel: false,
  },
  pro: {
    maxCompanies: 1,
    maxEmployees: 100,
    canExportCsv: true,
    canDownloadPayslips: true,
    canWhiteLabel: false,
  },
  cabinet: {
    maxCompanies: 25,
    maxEmployees: 2000,
    canExportCsv: true,
    canDownloadPayslips: true,
    canWhiteLabel: true,
  },
};

export type EmployerPayrollResult = {
  period: string;
  employeeName: string;
  calculationDate?: string;
  earnings: {
    baseSalary?: number;
    overtimePay?: number;
    bonus?: number;
    allowances?: number;
    totalGross: number;
  };
  deductions: {
    cnssEmployeeShortTerm?: number;
    cnssEmployeeLongTerm?: number;
    cnssEmployee: number;
    amoEmployee: number;
    cimrEmployee?: number;
    professionalExpenseDeduction?: number;
    taxableIncome?: number;
    familyTaxReduction?: number;
    incomeTax: number;
    totalDeductions: number;
  };
  netToPay: number;
  employerContributions: {
    cnssEmployerShortTerm?: number;
    cnssEmployerLongTerm?: number;
    cnssEmployer: number;
    familyAllowanceEmployer?: number;
    amoEmployer: number;
    formationPro: number;
    totalEmployerCost: number;
  };
  explanation?: {
    versionCode?: string;
    warnings?: string[];
  };
};

export type EmployerPayrollLine = {
  employeeId: string;
  employeeName: string;
  result: EmployerPayrollResult;
};

export type EmployerPayrollRun = {
  id: string;
  period: string;
  createdAt: string;
  lines: EmployerPayrollLine[];
};

export type EmployerCnssRow = {
  employeeId: string;
  employeeName: string;
  employeeCin: string;
  cnssNumber: string;
  contractType: string;
  gross: number;
  declaredDays: number;
  cnssBase: number;
  cnssEmployee: number;
  cnssEmployer: number;
  totalCnss: number;
};

export type EmployerCnssExport = {
  id: string;
  payrollRunId?: string;
  period: string;
  filename: string;
  status: "prepared" | "downloaded";
  createdAt: string;
  rows: EmployerCnssRow[];
  totals: {
    employees: number;
    gross: number;
    cnssBase: number;
    cnssEmployee: number;
    cnssEmployer: number;
    totalCnss: number;
    missingCnss: number;
  };
};

export type EmployerComplianceDismissal = {
  alertId: string;
  reason: string;
  dismissedAt: string;
};

export type EmployerContractRecord = {
  id: string;
  generatedContractId?: string;
  employeeId?: string;
  employeeName: string;
  contractType: "CDI" | "CDD" | "INTERIM" | "STAGE";
  contractDate: string;
  status: "generated" | "downloaded";
  filename: string;
  content: string;
  contractData: Record<string, unknown>;
  warnings?: { field: string; message: string }[];
  createdAt: string;
};

export const employerMetrics: EmployerMetric[] = [
  {
    label: "Paie mensuelle",
    value: "0 MAD",
    detail: "Aucune entreprise active pour le moment",
    icon: FileText,
  },
  {
    label: "Salaries",
    value: "0",
    detail: "Registre a initialiser",
    icon: Users,
  },
  {
    label: "Conformite",
    value: "Setup",
    detail: "CNSS, contrats et documents a verifier",
    icon: ShieldCheck,
  },
  {
    label: "Plan",
    value: "Free",
    detail: "Exports et PDF limites par gate",
    icon: Lock,
  },
];

export const employerSaasModules: EmployerSaasModule[] = [
  {
    id: "people",
    title: "Registre & contrats",
    scope: "Socle RH",
    description: "Fiches salaries, contrats, anciennete et pieces RH utiles au cycle employeur.",
    href: "/employer/employees",
    links: [
      { label: "Salaries", href: "/employer/employees" },
      { label: "Contrats", href: "/employer/contracts" },
    ],
    icon: ClipboardList,
  },
  {
    id: "payroll",
    title: "Paie & declarations",
    scope: "Mensuel",
    description: "Runs de paie, bulletins, readiness et preparation CNSS/IR du mois.",
    href: "/employer/payroll",
    links: [
      { label: "Paie", href: "/employer/payroll" },
      { label: "Declarations", href: "/employer/cnss" },
    ],
    icon: FileText,
  },
  {
    id: "time",
    title: "Temps & absences",
    scope: "Variables",
    description: "Pointage, heures supplementaires, demandes de conge et validations patron.",
    href: "/employer/time",
    links: [
      { label: "Pointage", href: "/employer/time" },
      { label: "Conges", href: "/employer/leave" },
    ],
    icon: Timer,
  },
  {
    id: "self-service",
    title: "Self-service salarie",
    scope: "Experience",
    description: "Bulletins, documents et demandes salarie dans le contexte employeur actif.",
    href: "/employer/self-service",
    links: [{ label: "Portail salarie", href: "/employer/self-service" }],
    icon: Mail,
  },
  {
    id: "compliance",
    title: "Conformite & assistant",
    scope: "Controle",
    description: "Alertes RH, risques de paie et aide contextuelle pour traiter les priorites.",
    href: "/employer/compliance",
    links: [
      { label: "Alertes", href: "/employer/compliance" },
      { label: "Assistant", href: "/employer/assistant" },
    ],
    icon: ShieldCheck,
  },
  {
    id: "pilotage",
    title: "Analytics & cabinet",
    scope: "Pilotage",
    description: "Masse salariale, tendances et mode multi-entreprises pour cabinets RH.",
    href: "/employer/analytics",
    links: [
      { label: "Analytics", href: "/employer/analytics" },
      { label: "Cabinet", href: "/employer/cabinet" },
    ],
    icon: ChartNoAxesCombined,
  },
];

export const phaseOneActions: EmployerAction[] = [
  {
    title: "Generation de fiches de paie PDF",
    description: "Preparer un bulletin mensuel conforme, telechargeable et envoyable par email.",
    phase: "Phase 1",
    impact: "Impact fort",
    status: "ready",
    href: "/employer/payroll",
    icon: FileText,
  },
  {
    title: "Registre du personnel & contrats",
    description: "Centraliser fiche salarie, type de contrat, anciennete et documents attaches.",
    phase: "Phase 1",
    impact: "Impact fort",
    status: "foundation",
    href: "/employer/employees",
    icon: ClipboardList,
  },
  {
    title: "Declarations employeur",
    description: "Structurer les recaps mensuels CNSS et IR depuis la paie avant export.",
    phase: "Phase 1",
    impact: "Impact fort",
    status: "foundation",
    href: "/employer/cnss",
    icon: Download,
  },
  {
    title: "Auth multi-entreprise + freemium gate",
    description: "Isoler chaque entreprise, puis limiter PDF et exports selon le plan.",
    phase: "Phase 1",
    impact: "Impact moyen",
    status: "foundation",
    icon: Building2,
  },
];

export const nextPhaseActions: EmployerAction[] = [
  {
    title: "Pointage & heures supplementaires",
    description: "Saisie hebdomadaire, calcul auto des majorations legales et validation patron.",
    phase: "Phase 2",
    impact: "Impact fort",
    status: "foundation",
    href: "/employer/time",
    icon: Timer,
  },
  {
    title: "Suivi des conges & absences",
    description: "Compteur legal, solde en temps reel et validation patron.",
    phase: "Phase 2",
    impact: "Impact fort",
    status: "foundation",
    href: "/employer/leave",
    icon: CalendarClock,
  },
  {
    title: "Alertes & rappels de conformite",
    description: "CDD expirant, CNSS due, SMIG reevalue et IR a mettre a jour.",
    phase: "Phase 2",
    impact: "Impact moyen",
    status: "foundation",
    href: "/employer/compliance",
    icon: BadgeCheck,
  },
  {
    title: "Assistant RH IA droit du travail",
    description: "Questions RH contextuelles, synthese des risques et actions a lancer.",
    phase: "Phase 2",
    impact: "Moat",
    status: "foundation",
    href: "/employer/assistant",
    icon: BrainCircuit,
  },
  {
    title: "Portail employe self-service",
    description: "Acces bulletins, demandes de conge et documents RH.",
    phase: "Phase 3",
    impact: "Moat",
    status: "foundation",
    href: "/employer/self-service",
    icon: Mail,
  },
  {
    title: "Mode fiduciaire / cabinet RH",
    description: "Multi-entreprises, tableau de bord consolide et marque blanche.",
    phase: "Phase 3",
    impact: "Impact fort",
    status: "foundation",
    href: "/employer/cabinet",
    icon: Building2,
  },
  {
    title: "Analytique RH & masse salariale",
    description: "Evolution couts, projection annuelle et benchmarks sectoriels.",
    phase: "Phase 3",
    impact: "Impact moyen",
    status: "foundation",
    href: "/employer/analytics",
    icon: ChartNoAxesCombined,
  },
];

export const employerSetupChecklist = [
  "Creer ou selectionner une entreprise",
  "Ajouter les salaries et contrats actifs",
  "Verifier salaire de base, primes et anciennete",
  "Generer le premier bulletin de paie",
  "Debloquer les exports PDF/CSV selon le plan",
];

export const employerDocumentChecklist: EmployerEmployeeDocument[] = [
  {
    type: "contract",
    label: "Contrat signe",
    attached: false,
  },
  {
    type: "cin",
    label: "Copie CIN",
    attached: false,
  },
  {
    type: "cnss",
    label: "Immatriculation CNSS",
    attached: false,
  },
  {
    type: "rib",
    label: "RIB",
    attached: false,
  },
  {
    type: "medical",
    label: "Certificat medical",
    attached: false,
  },
];

export const sampleEmployerEmployees: EmployerEmployee[] = [
  {
    id: "emp-1",
    fullName: "Sara El Mansouri",
    role: "Responsable administrative",
    contractType: "CDI",
    startDate: "2023-03-01",
    grossSalary: 9200,
    cnssNumber: "CNSS-2489157",
    email: "sara@atlas.example",
    documents: employerDocumentChecklist.map((document) => ({ ...document, attached: document.type !== "medical" })),
    status: "Actif",
  },
  {
    id: "emp-2",
    fullName: "Youssef Berrada",
    role: "Technicien support",
    contractType: "CDD",
    startDate: "2025-10-15",
    grossSalary: 6800,
    cnssNumber: "CNSS-7812044",
    email: "youssef@atlas.example",
    documents: employerDocumentChecklist.map((document) => ({
      ...document,
      attached: ["contract", "cin", "cnss"].includes(document.type),
    })),
    status: "Actif",
  },
  {
    id: "emp-3",
    fullName: "Nadia Alaoui",
    role: "Comptable",
    contractType: "CDI",
    startDate: "2021-06-10",
    grossSalary: 11500,
    cnssNumber: "CNSS-5460182",
    email: "nadia@atlas.example",
    documents: employerDocumentChecklist.map((document) => ({ ...document, attached: true })),
    status: "Actif",
  },
];

export const sampleEmployerCompanies: EmployerCompany[] = [
  {
    id: "company-demo-1",
    name: "Atlas Services SARL",
    ice: "002154789000041",
    cnssAffiliateNumber: "CNSS-EMP-104578",
    city: "Casablanca",
    plan: "free",
  },
];

export const employerLeaveTypeLabels: Record<EmployerLeaveType, string> = {
  paid: "Conge paye",
  sick: "Arret maladie",
  unpaid: "Sans solde",
  exceptional: "Exceptionnel",
};

export const employerLeaveStatusLabels: Record<EmployerLeaveStatus, string> = {
  pending: "A valider",
  approved: "Approuve",
  rejected: "Refuse",
};

export const sampleEmployerLeaveRequests: EmployerLeaveRequest[] = [
  {
    id: "leave-demo-1",
    employeeId: "emp-1",
    employeeName: "Sara El Mansouri",
    type: "paid",
    startDate: "2026-05-27",
    endDate: "2026-05-29",
    days: 3,
    status: "pending",
    reason: "Conge familial",
    createdAt: "2026-05-20T09:00:00.000Z",
  },
  {
    id: "leave-demo-2",
    employeeId: "emp-2",
    employeeName: "Youssef Berrada",
    type: "sick",
    startDate: "2026-04-15",
    endDate: "2026-04-16",
    days: 2,
    status: "approved",
    reason: "Certificat medical recu",
    createdAt: "2026-04-14T11:00:00.000Z",
    decidedAt: "2026-04-14T13:00:00.000Z",
  },
];

export const employerTimeEntryStatusLabels: Record<EmployerTimeEntryStatus, string> = {
  draft: "A valider",
  approved: "Approuve",
  rejected: "Refuse",
};

export const sampleEmployerTimeEntries: EmployerTimeEntry[] = [
  {
    id: "time-demo-1",
    employeeId: "emp-1",
    employeeName: "Sara El Mansouri",
    weekStart: "2026-05-18",
    regularHours: 44,
    overtimeDayHours: 3,
    overtimeNightHours: 0,
    overtimeRestOrHolidayDayHours: 0,
    overtimeRestOrHolidayNightHours: 0,
    overtimeAmount: 180.63,
    status: "draft",
    note: "Cloture mensuelle",
    createdAt: "2026-05-20T10:00:00.000Z",
  },
];
