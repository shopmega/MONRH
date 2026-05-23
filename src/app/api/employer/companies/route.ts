import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/server/user-session";
import { listEmployerCompanies, replaceEmployerCompanies, upsertEmployerCompany } from "@/lib/server/employer-core-store";

const companySchema = z.object({
  id: z.string().min(1).max(120),
  name: z.string().min(1).max(180),
  ice: z.string().min(1).max(80),
  cnssAffiliateNumber: z.string().min(1).max(80),
  city: z.string().min(1).max(120),
  plan: z.enum(["free", "pro", "cabinet"]),
});

const saveCompaniesSchema = z.object({
  items: z.array(companySchema).max(50),
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
