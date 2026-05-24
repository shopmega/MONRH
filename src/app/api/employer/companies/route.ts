import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/server/user-session";
import {
  isEmployerPlanLimitError,
  listEmployerCompanies,
  replaceEmployerCompanies,
  upsertEmployerCompany,
} from "@/lib/server/employer-core-store";

const companySchema = z.object({
  id: z.string().min(1).max(120),
  name: z.string().min(1).max(180),
  legalForm: z.string().max(80).optional(),
  address: z.string().max(240).optional(),
  ice: z.string().min(1).max(80),
  taxIdentifier: z.string().max(80).optional(),
  rcNumber: z.string().max(80).optional(),
  cnssAffiliateNumber: z.string().min(1).max(80),
  city: z.string().min(1).max(120),
  contactEmail: z.string().email().optional().or(z.literal("")),
  bankRib: z.string().max(180).optional(),
  signatoryName: z.string().max(160).optional(),
  signatoryRole: z.string().max(120).optional(),
  plan: z.enum(["free", "pro", "cabinet"]),
});

const saveCompaniesSchema = z.object({
  items: z.array(companySchema).max(25),
});

const saveCompanySchema = z.object({
  item: companySchema,
});

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const items = await listEmployerCompanies(userId);
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    if (isEmployerPlanLimitError(error)) {
      return NextResponse.json({ ok: false, error: error.code, message: error.message }, { status: 403 });
    }
    return NextResponse.json(
      {
        ok: false,
        error: "employer_companies_unavailable",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const payload = saveCompaniesSchema.parse(await request.json());
    const items = await replaceEmployerCompanies(userId, payload.items);
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    if (isEmployerPlanLimitError(error)) {
      return NextResponse.json({ ok: false, error: error.code, message: error.message }, { status: 403 });
    }
    return NextResponse.json(
      {
        ok: false,
        error: "employer_companies_save_failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 },
    );
  }
}

export const PUT = POST;

export async function PATCH(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const payload = saveCompanySchema.parse(await request.json());
    const item = await upsertEmployerCompany(userId, payload.item);
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    if (isEmployerPlanLimitError(error)) {
      return NextResponse.json({ ok: false, error: error.code, message: error.message }, { status: 403 });
    }
    return NextResponse.json(
      {
        ok: false,
        error: "employer_company_save_failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 },
    );
  }
}
