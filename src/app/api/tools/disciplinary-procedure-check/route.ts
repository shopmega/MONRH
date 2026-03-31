import { NextRequest, NextResponse } from "next/server";
import { requireToolAccessOrResponse } from "@/lib/server/tool-access-enforcement";
import {
  checkDisciplinaryProcedure,
  disciplinaryProcedureCheckInputSchema,
} from "@/lib/tools/disciplinary-procedure-check";
import { recordToolUsage } from "@/lib/server/tool-usage-history";

export async function POST(request: NextRequest) {
  const accessDenied = await requireToolAccessOrResponse("disciplinary_procedure_check");
  if (accessDenied) return accessDenied;
  try {
    const payload = await request.json();
    const input = disciplinaryProcedureCheckInputSchema.parse(payload);
    const result = checkDisciplinaryProcedure(input);

    await recordToolUsage("disciplinary_procedure_check", input, result);

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "invalid_payload" },
      { status: 400 },
    );
  }
}
