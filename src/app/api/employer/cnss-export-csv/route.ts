import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listEmployerCnssExports, listEmployerCompanies } from "@/lib/server/employer-core-store";
import {
  isEmployerPlanFeatureRequiredError,
  requireEmployerPlanFeature,
} from "@/lib/server/employer-subscription-store";
import { getCurrentUserId } from "@/lib/server/user-session";

const cnssExportCsvSchema = z.object({
  companyId: z.string().min(1).max(120),
  exportId: z.string().min(1).max(120),
});

function csvEscape(value: string | number) {
  const text = String(value);
  if (!/[",\n;]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function safeFilename(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9.]+/gi, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase() || "cnss-export.csv"
  );
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const payload = cnssExportCsvSchema.parse(await request.json());
    const company = (await listEmployerCompanies(userId)).find((item) => item.id === payload.companyId);
    if (!company) {
      return NextResponse.json({ ok: false, error: "employer_company_access_denied" }, { status: 403 });
    }
    await requireEmployerPlanFeature(userId, "cnss_csv");
    if (!company.cnssAffiliateNumber.trim()) {
      return NextResponse.json({ ok: false, error: "missing_employer_cnss_affiliate_number" }, { status: 400 });
    }

    const cnssExport = (await listEmployerCnssExports(userId, company.id)).find((item) => item.id === payload.exportId);
    if (!cnssExport) {
      return NextResponse.json({ ok: false, error: "cnss_export_not_found" }, { status: 404 });
    }
    if (cnssExport.rows.length === 0) {
      return NextResponse.json({ ok: false, error: "cnss_export_empty" }, { status: 400 });
    }

    const headers = [
      "periode",
      "matricule_employeur",
      "matricule_cnss_salarie",
      "numero_cin_salarie",
      "nom_prenom_salarie",
      "nombre_jours_declares",
      "salaire_brut_declare_mad",
      "salaire_plafonne_long_terme_mad",
      "cotisation_salariale_totale_mad",
      "cotisation_patronale_totale_mad",
    ];
    const lines = [
      headers.join(";"),
      ...cnssExport.rows.map((row) =>
        [
          cnssExport.period,
          company.cnssAffiliateNumber,
          row.cnssNumber,
          row.employeeCin,
          row.employeeName,
          row.declaredDays.toFixed(0),
          row.gross.toFixed(2),
          row.cnssBase.toFixed(2),
          row.cnssEmployee.toFixed(2),
          row.cnssEmployer.toFixed(2),
        ]
          .map(csvEscape)
          .join(";"),
      ),
    ];
    const body = new TextEncoder().encode(`\uFEFF${lines.join("\n")}`);
    const filename = safeFilename(cnssExport.filename);

    return new NextResponse(body, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (isEmployerPlanFeatureRequiredError(error)) {
      return NextResponse.json({ ok: false, error: "cnss_csv_plan_required" }, { status: 403 });
    }
    return NextResponse.json(
      {
        ok: false,
        error: "cnss_export_csv_failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 },
    );
  }
}
