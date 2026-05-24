import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit/js/pdfkit.standalone.js";
import { z } from "zod";
import { listEmployerCompanies } from "@/lib/server/employer-core-store";
import {
  canonicalizePayslipPdfResult,
  isEmployerPayrollValidationError,
} from "@/lib/server/employer-payroll-validation";
import {
  isEmployerPlanFeatureRequiredError,
  requireEmployerPlanFeature,
} from "@/lib/server/employer-subscription-store";
import { getCurrentUserId } from "@/lib/server/user-session";

export const runtime = "nodejs";

const moneySchema = z.number().finite();

const payrollPayElementSchema = z.object({
  label: z.string().min(1).max(120),
  amount: moneySchema.nonnegative(),
  category: z.enum(["overtime", "bonus", "allowance", "benefit"]),
  taxable: z.boolean(),
  cnssSubject: z.boolean(),
  amoSubject: z.boolean(),
});

const payslipPdfSchema = z.object({
  companyId: z.string().min(1).max(120),
  company: z.object({
    name: z.string().min(1).max(160),
    address: z.string().max(180).default(""),
    ice: z.string().max(80).default(""),
    taxIdentifier: z.string().max(80).default(""),
    cnssAffiliateNumber: z.string().max(80).default(""),
    city: z.string().max(80).default(""),
  }),
  employee: z.object({
    id: z.string().min(1).max(120),
    fullName: z.string().min(1).max(160),
    employeeNumber: z.string().max(80).default(""),
    cin: z.string().max(80).default(""),
    role: z.string().max(120).default(""),
    department: z.string().max(120).default(""),
    hireDate: z.string().max(40).default(""),
    contractType: z.string().max(40).default(""),
    familySituation: z.string().max(80).default(""),
    dependents: z.string().max(40).default(""),
    cnssNumber: z.string().max(80).default(""),
    bankRib: z.string().max(180).default(""),
  }),
  period: z.string().min(1).max(80),
  payElements: z.array(payrollPayElementSchema).max(100).optional(),
  payPeriod: z
    .object({
      from: z.string().max(40).default(""),
      to: z.string().max(40).default(""),
      workedDays: z.string().max(40).default(""),
      workedHours: z.string().max(40).default(""),
      paymentMethod: z.string().max(80).default(""),
    })
    .default({
      from: "",
      to: "",
      workedDays: "",
      workedHours: "",
      paymentMethod: "",
    }),
  result: z.object({
    calculationDate: z.string().max(40).optional(),
    earnings: z.object({
      baseSalary: moneySchema.default(0),
      overtimePay: moneySchema.default(0),
      bonus: moneySchema.default(0),
      allowances: moneySchema.default(0),
      totalGross: moneySchema,
    }),
    deductions: z.object({
      cnssEmployeeShortTerm: moneySchema.default(0),
      cnssEmployeeLongTerm: moneySchema.default(0),
      cnssEmployee: moneySchema,
      amoEmployee: moneySchema,
      cimrEmployee: moneySchema.default(0),
      professionalExpenseDeduction: moneySchema.default(0),
      taxableIncome: moneySchema.default(0),
      familyTaxReduction: moneySchema.default(0),
      incomeTax: moneySchema,
      totalDeductions: moneySchema,
    }),
    netToPay: moneySchema,
    employerContributions: z.object({
      cnssEmployerShortTerm: moneySchema.default(0),
      cnssEmployerLongTerm: moneySchema.default(0),
      cnssEmployer: moneySchema.default(0),
      familyAllowanceEmployer: moneySchema.default(0),
      amoEmployer: moneySchema.default(0),
      formationPro: moneySchema.default(0),
      totalEmployerCost: moneySchema,
    }),
    explanation: z
      .object({
        versionCode: z.string().max(80).optional(),
      })
      .optional(),
  }),
  annualTotals: z.object({
    incomeTax: moneySchema,
    cnssEmployee: moneySchema,
  }),
});

function formatMAD(value: number) {
  return `${value.toLocaleString("fr-MA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} MAD`;
}

function formatAmount(value: number) {
  return value.toLocaleString("fr-MA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function displayValue(value?: string) {
  return value?.trim() || "-";
}

function formatDate(value?: string) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return displayValue(value);
  return parsed.toLocaleDateString("fr-MA");
}

const frenchSmallNumbers = [
  "zero",
  "un",
  "deux",
  "trois",
  "quatre",
  "cinq",
  "six",
  "sept",
  "huit",
  "neuf",
  "dix",
  "onze",
  "douze",
  "treize",
  "quatorze",
  "quinze",
  "seize",
  "dix-sept",
  "dix-huit",
  "dix-neuf",
];

function underHundredToFrench(value: number): string {
  if (value < 20) return frenchSmallNumbers[value];
  if (value < 70) {
    const tens = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante"][Math.floor(value / 10)];
    const unit = value % 10;
    if (unit === 0) return tens;
    return `${tens}${unit === 1 ? " et " : "-"}${frenchSmallNumbers[unit]}`;
  }
  if (value < 80) return `soixante-${underHundredToFrench(value - 60)}`;
  if (value === 80) return "quatre-vingts";
  return `quatre-vingt-${underHundredToFrench(value - 80)}`;
}

function underThousandToFrench(value: number): string {
  if (value < 100) return underHundredToFrench(value);
  const hundreds = Math.floor(value / 100);
  const rest = value % 100;
  const prefix = hundreds === 1 ? "cent" : `${frenchSmallNumbers[hundreds]} cent`;
  return rest === 0 ? prefix : `${prefix} ${underHundredToFrench(rest)}`;
}

function integerToFrench(value: number): string {
  if (value < 1000) return underThousandToFrench(value);
  if (value < 1_000_000) {
    const thousands = Math.floor(value / 1000);
    const rest = value % 1000;
    const prefix = thousands === 1 ? "mille" : `${integerToFrench(thousands)} mille`;
    return rest === 0 ? prefix : `${prefix} ${underThousandToFrench(rest)}`;
  }
  return value.toLocaleString("fr-MA");
}

function amountInFrenchWords(value: number) {
  const absolute = Math.abs(value);
  const dirhams = Math.floor(absolute);
  const centimes = Math.round((absolute - dirhams) * 100);
  const sign = value < 0 ? "moins " : "";
  const dirhamLabel = dirhams === 1 ? "dirham" : "dirhams";
  if (centimes === 0) return `${sign}${integerToFrench(dirhams)} ${dirhamLabel}`;
  const centimeLabel = centimes === 1 ? "centime" : "centimes";
  return `${sign}${integerToFrench(dirhams)} ${dirhamLabel} et ${integerToFrench(centimes)} ${centimeLabel}`;
}

function drawPanel(doc: PDFDocument, title: string, x: number, y: number, width: number, height: number) {
  doc.roundedRect(x, y, width, height, 5).strokeColor("#d8d0c8").stroke();
  doc.rect(x, y, width, 17).fill("#f2eee9");
  doc
    .fillColor("#6b5a4f")
    .font("Helvetica-Bold")
    .fontSize(7)
    .text(title.toUpperCase(), x + 8, y + 5, { width: width - 16 });
}

function addInfoField(doc: PDFDocument, label: string, value: string | undefined, x: number, y: number, width: number) {
  doc.fillColor("#6b5a4f").font("Helvetica-Bold").fontSize(5.8).text(label.toUpperCase(), x, y, { width });
  doc.fillColor("#111111").font("Helvetica").fontSize(7.1).text(displayValue(value), x, y + 7, {
    width,
    lineBreak: false,
    ellipsis: true,
  });
}

function drawRule(doc: PDFDocument, x: number, y: number, width: number) {
  doc.moveTo(x, y).lineTo(x + width, y).strokeColor("#e4ddd6").stroke();
}

function addAmountRow(
  doc: PDFDocument,
  label: string,
  amount: string,
  x: number,
  y: number,
  width: number,
  strong = false,
) {
  doc
    .fillColor("#111111")
    .font(strong ? "Helvetica-Bold" : "Helvetica")
    .fontSize(strong ? 7.8 : 7.2)
    .text(label, x, y, { width: width - 72, lineBreak: false, ellipsis: true });
  doc
    .fillColor(strong ? "#8a5022" : "#111111")
    .font(strong ? "Helvetica-Bold" : "Helvetica")
    .fontSize(strong ? 7.8 : 7.2)
    .text(amount, x + width - 74, y, { width: 66, align: "right" });
}

function addMultiColumnHeader(doc: PDFDocument, x: number, y: number, widths: [number, number, number, number]) {
  const [labelWidth, baseWidth, rateWidth, amountWidth] = widths;
  doc.fillColor("#6b5a4f").font("Helvetica-Bold").fontSize(6.2);
  doc.text("LIBELLE", x, y, { width: labelWidth });
  doc.text("BASE", x + labelWidth, y, { width: baseWidth, align: "right" });
  doc.text("TAUX", x + labelWidth + baseWidth, y, { width: rateWidth, align: "right" });
  doc.text("MONTANT", x + labelWidth + baseWidth + rateWidth, y, { width: amountWidth, align: "right" });
}

function addMultiColumnRow(
  doc: PDFDocument,
  row: { label: string; base: string; rate: string; amount: string },
  x: number,
  y: number,
  widths: [number, number, number, number],
  strong = false,
) {
  const [labelWidth, baseWidth, rateWidth, amountWidth] = widths;
  doc.fillColor(strong ? "#111111" : "#1c1c1c").font(strong ? "Helvetica-Bold" : "Helvetica").fontSize(6.8);
  doc.text(row.label, x, y, { width: labelWidth, lineBreak: false, ellipsis: true });
  doc.text(row.base, x + labelWidth, y, { width: baseWidth, align: "right" });
  doc.text(row.rate, x + labelWidth + baseWidth, y, { width: rateWidth, align: "right" });
  doc
    .fillColor(strong ? "#8a5022" : "#1c1c1c")
    .text(row.amount, x + labelWidth + baseWidth + rateWidth, y, { width: amountWidth, align: "right" });
}

function createPayslipPdf(payload: z.infer<typeof payslipPdfSchema>) {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 28 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const totalGross = payload.result.earnings.totalGross;
    const socialDeductions =
      payload.result.deductions.cnssEmployee +
      payload.result.deductions.amoEmployee +
      payload.result.deductions.cimrEmployee;
    const incomeTaxGross = payload.result.deductions.incomeTax + payload.result.deductions.familyTaxReduction;
    const deductionWidths: [number, number, number, number] = [108, 52, 34, 54];
    const chargeWidths: [number, number, number, number] = [258, 84, 64, 105];

    doc.rect(0, 0, 595.28, 69).fill("#8a5022");
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(18).text("BULLETIN DE PAIE", 28, 22);
    doc.font("Helvetica").fontSize(9).text(`Mois : ${payload.period}`, 28, 45);
    doc.font("Helvetica-Bold").fontSize(8).text(payload.company.name, 340, 22, { width: 227, align: "right" });
    doc.font("Helvetica").fontSize(7).text(`Regles : ${payload.result.explanation?.versionCode ?? "Courantes"}`, 340, 45, {
      width: 227,
      align: "right",
    });

    drawPanel(doc, "Entreprise", 28, 82, 262, 112);
    addInfoField(doc, "Raison sociale", payload.company.name, 36, 105, 246);
    addInfoField(doc, "Adresse", payload.company.address || payload.company.city, 36, 123, 246);
    addInfoField(doc, "ICE", payload.company.ice, 36, 141, 116);
    addInfoField(doc, "Identifiant fiscal", payload.company.taxIdentifier, 166, 141, 116);
    addInfoField(doc, "CNSS employeur", payload.company.cnssAffiliateNumber, 36, 159, 246);
    addInfoField(doc, "Ville", payload.company.city, 36, 177, 246);

    drawPanel(doc, "Salarie", 305, 82, 262, 112);
    addInfoField(doc, "Nom et prenom", payload.employee.fullName, 313, 105, 246);
    addInfoField(doc, "Matricule", payload.employee.employeeNumber, 313, 123, 116);
    addInfoField(doc, "CIN", payload.employee.cin, 443, 123, 116);
    addInfoField(doc, "N CNSS", payload.employee.cnssNumber, 313, 141, 116);
    addInfoField(doc, "Poste", payload.employee.role, 443, 141, 116);
    addInfoField(doc, "Departement", payload.employee.department, 313, 159, 116);
    addInfoField(doc, "Date embauche", formatDate(payload.employee.hireDate), 443, 159, 116);
    addInfoField(doc, "Contrat", payload.employee.contractType, 313, 177, 58);
    addInfoField(doc, "Situation", payload.employee.familySituation, 381, 177, 84);
    addInfoField(doc, "A charge", payload.employee.dependents, 475, 177, 84);

    drawPanel(doc, "Periode de paie", 28, 204, 539, 50);
    addInfoField(doc, "Du", formatDate(payload.payPeriod.from), 36, 226, 70);
    addInfoField(doc, "Au", formatDate(payload.payPeriod.to), 118, 226, 70);
    addInfoField(doc, "Jours travailles", payload.payPeriod.workedDays, 200, 226, 70);
    addInfoField(doc, "Heures travaillees", payload.payPeriod.workedHours, 282, 226, 74);
    addInfoField(doc, "Paiement", payload.payPeriod.paymentMethod, 368, 226, 76);
    addInfoField(doc, "Banque / RIB", payload.employee.bankRib, 456, 226, 103);

    drawPanel(doc, "Elements de remuneration", 28, 264, 262, 184);
    doc.fillColor("#6b5a4f").font("Helvetica-Bold").fontSize(6.2).text("LIBELLE", 36, 286, { width: 170 });
    doc.text("MONTANT MAD", 208, 286, { width: 74, align: "right" });
    drawRule(doc, 36, 296, 246);
    [
      ["Salaire de base", formatAmount(payload.result.earnings.baseSalary)],
      ["Heures supplementaires", formatAmount(payload.result.earnings.overtimePay)],
      ["Prime de rendement", formatAmount(payload.result.earnings.bonus)],
      ["Prime d'anciennete", "-"],
      ["Prime exceptionnelle", "-"],
      ["Indemnite de transport", "-"],
      ["Indemnite de representation", "-"],
      ["Avantages en nature", "-"],
      ["Autres indemnites", formatAmount(payload.result.earnings.allowances)],
    ].forEach(([label, amount], index) => addAmountRow(doc, label, amount, 36, 305 + index * 12, 246));
    drawRule(doc, 36, 418, 246);
    addAmountRow(doc, "TOTAL BRUT", formatAmount(totalGross), 36, 427, 246, true);

    drawPanel(doc, "Retenues salariales", 305, 264, 262, 124);
    addMultiColumnHeader(doc, 313, 286, deductionWidths);
    drawRule(doc, 313, 296, 246);
    [
      { label: "CNSS CT salarie", base: formatAmount(totalGross), rate: "0.52%", amount: formatAmount(payload.result.deductions.cnssEmployeeShortTerm) },
      { label: "CNSS LT salarie", base: `min(${formatAmount(totalGross)}, 6 000)`, rate: "3.96%", amount: formatAmount(payload.result.deductions.cnssEmployeeLongTerm) },
      { label: "AMO salarie", base: "-", rate: "-", amount: formatAmount(payload.result.deductions.amoEmployee) },
      { label: "CIMR salarie", base: "-", rate: "-", amount: formatAmount(payload.result.deductions.cimrEmployee) },
      {
        label: "IR retenu",
        base: formatAmount(payload.result.deductions.taxableIncome),
        rate: "-",
        amount: formatAmount(payload.result.deductions.incomeTax),
      },
    ].forEach((row, index) => addMultiColumnRow(doc, row, 313, 303 + index * 10.2, deductionWidths));
    drawRule(doc, 313, 377, 246);
    addMultiColumnRow(
      doc,
      { label: "TOTAL RETENUES", base: "", rate: "", amount: formatAmount(payload.result.deductions.totalDeductions) },
      313,
      379,
      deductionWidths,
      true,
    );

    drawPanel(doc, "Calcul de l'IR", 305, 396, 262, 100);
    [
      ["Salaire brut imposable", formatAmount(totalGross)],
      ["Deductions sociales", formatAmount(socialDeductions)],
      ["Frais professionnels", formatAmount(payload.result.deductions.professionalExpenseDeduction)],
      ["Revenu net imposable", formatAmount(payload.result.deductions.taxableIncome)],
      ["IR brut", formatAmount(incomeTaxGross)],
      ["Charges de famille", formatAmount(payload.result.deductions.familyTaxReduction)],
      ["IR net retenu", formatAmount(payload.result.deductions.incomeTax)],
    ].forEach(([label, amount], index) => addAmountRow(doc, label, amount, 313, 418 + index * 10.2, 246, index === 6));

    doc.roundedRect(28, 510, 539, 58, 5).fillAndStroke("#eef6f0", "#b8d9c3");
    doc.fillColor("#0f7a45").font("Helvetica-Bold").fontSize(8).text("NET A PAYER", 42, 523);
    doc.fontSize(16).text(formatMAD(payload.result.netToPay), 42, 536, { width: 220 });
    doc.fillColor("#0f7a45").font("Helvetica").fontSize(6.8).text(amountInFrenchWords(payload.result.netToPay), 42, 554, {
      width: 278,
      lineBreak: false,
      ellipsis: true,
    });
    doc.fillColor("#6b5a4f").fontSize(7).text("Total brut", 336, 522, { width: 76 });
    doc.fillColor("#111111").fontSize(8).text(formatMAD(totalGross), 416, 521, { width: 136, align: "right" });
    doc.fillColor("#6b5a4f").fontSize(7).text("Total retenues", 336, 539, { width: 76 });
    doc.fillColor("#111111").fontSize(8).text(formatMAD(payload.result.deductions.totalDeductions), 416, 538, {
      width: 136,
      align: "right",
    });
    doc.fillColor("#6b5a4f").fontSize(6.4).text("Cumuls annuels IR / CNSS", 336, 555, { width: 100 });
    doc
      .fillColor("#111111")
      .fontSize(6.8)
      .text(`${formatAmount(payload.annualTotals.incomeTax)} / ${formatAmount(payload.annualTotals.cnssEmployee)}`, 442, 554, {
        width: 110,
        align: "right",
      });

    drawPanel(doc, "Charges patronales - information", 28, 570, 539, 125);
    addMultiColumnHeader(doc, 36, 592, chargeWidths);
    drawRule(doc, 36, 602, 515);
    [
      { label: "CNSS CT employeur", base: formatAmount(totalGross), rate: "1.05%", amount: formatAmount(payload.result.employerContributions.cnssEmployerShortTerm) },
      { label: "CNSS LT employeur", base: `min(${formatAmount(totalGross)}, 6 000)`, rate: "7.93%", amount: formatAmount(payload.result.employerContributions.cnssEmployerLongTerm) },
      { label: "AMO employeur", base: "-", rate: "-", amount: formatAmount(payload.result.employerContributions.amoEmployer) },
      {
        label: "Allocations familiales",
        base: formatAmount(totalGross),
        rate: "-",
        amount: formatAmount(payload.result.employerContributions.familyAllowanceEmployer),
      },
      {
        label: "Taxe de formation professionnelle",
        base: formatAmount(totalGross),
        rate: "-",
        amount: formatAmount(payload.result.employerContributions.formationPro),
      },
      { label: "CIMR employeur", base: "-", rate: "-", amount: "-" },
    ].forEach((row, index) => addMultiColumnRow(doc, row, 36, 610 + index * 11, chargeWidths));
    drawRule(doc, 36, 668, 515);
    addMultiColumnRow(
      doc,
      {
        label: "TOTAL CHARGES EMPLOYEUR",
        base: "",
        rate: "",
        amount: formatAmount(payload.result.employerContributions.totalEmployerCost - totalGross),
      },
      36,
      674,
      chargeWidths,
      true,
    );
    addMultiColumnRow(
      doc,
      {
        label: "COUT TOTAL EMPLOYEUR",
        base: "",
        rate: "",
        amount: formatAmount(payload.result.employerContributions.totalEmployerCost),
      },
      36,
      685,
      chargeWidths,
      true,
    );

    doc.fillColor("#111111").font("Helvetica").fontSize(7.4).text(`Fait a : ${displayValue(payload.company.city)}`, 28, 716);
    doc.text(`Le : ${formatDate(payload.result.calculationDate)}`, 28, 728);
    doc.font("Helvetica-Bold").fontSize(7).text("Signature employeur", 28, 752, { width: 180 });
    doc.text("Signature salarie", 389, 752, { width: 178, align: "right" });
    drawRule(doc, 28, 786, 160);
    drawRule(doc, 407, 786, 160);
    doc
      .font("Helvetica")
      .fontSize(6.2)
      .fillColor("#6b5a4f")
      .text(
        "Document genere par SIMPAIE. Completer les champs non disponibles dans le registre avant remise officielle.",
        28,
        799,
        { width: 539, align: "center" },
      );

    doc.end();
  });
}

function safeFilename(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

export async function POST(request: NextRequest) {
  try {
    const payload = payslipPdfSchema.parse(await request.json());
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const company = (await listEmployerCompanies(userId)).find((item) => item.id === payload.companyId);
    if (!company) {
      return NextResponse.json({ ok: false, error: "employer_company_access_denied" }, { status: 403 });
    }
    await requireEmployerPlanFeature(userId, "payslip_pdf");
    const { employee, result, annualTotals } = await canonicalizePayslipPdfResult(
      userId,
      company.id,
      payload.employee.id,
      payload.period,
      {
        ...payload.result,
        period: payload.period,
        employeeName: payload.employee.fullName,
      },
      payload.payElements,
    );

    const pdfPayload = {
      ...payload,
      company: {
        ...payload.company,
        name: company.name,
        address: company.address ?? payload.company.address,
        ice: company.ice,
        taxIdentifier: company.taxIdentifier ?? payload.company.taxIdentifier,
        cnssAffiliateNumber: company.cnssAffiliateNumber,
        city: company.city,
      },
      employee: {
        ...payload.employee,
        fullName: employee.fullName,
        employeeNumber: employee.employeeNumber ?? employee.id,
        cin: employee.cin ?? "",
        role: employee.role,
        contractType: employee.contractType,
        cnssNumber: employee.cnssNumber,
        dependents: String(employee.childrenCount ?? 0),
        hireDate: employee.startDate,
      },
      result,
      annualTotals,
    };
    const pdf = await createPayslipPdf(pdfPayload);
    const filename = `bulletin-${safeFilename(pdfPayload.employee.fullName)}-${safeFilename(pdfPayload.period)}.pdf`;
    const body = new Uint8Array(pdf);

    return new NextResponse(body, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (isEmployerPlanFeatureRequiredError(error)) {
      return NextResponse.json({ ok: false, error: "payslip_pdf_plan_required" }, { status: 403 });
    }
    if (isEmployerPayrollValidationError(error)) {
      return NextResponse.json({ ok: false, error: error.code, message: error.message }, { status: 422 });
    }
    return NextResponse.json(
      {
        ok: false,
        message: "Impossible de generer le PDF.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 },
    );
  }
}
