import { NextRequest, NextResponse } from "next/server";
import { requireToolAccessOrResponse } from "@/lib/server/tool-access-enforcement";
import { z } from "zod";
import { recordToolUsage } from "@/lib/server/tool-usage-history";

const schema = z.object({
  delayDays: z.number().int().min(0),
  unpaidMonths: z.number().int().min(0).default(0),
  repeatedDelaysLast6Months: z.number().int().min(0).default(0),
});

export async function POST(request: NextRequest) {
  const accessDenied = await requireToolAccessOrResponse("salary_delay_alert");
  if (accessDenied) return accessDenied;
  try {
    const payload = await request.json();
    const input = schema.parse(payload);

    const base =
      input.delayDays * 1.2 +
      input.unpaidMonths * 20 +
      input.repeatedDelaysLast6Months * 8;
    const riskScore = Math.min(100, Math.round(base));
    const level = riskScore >= 70 ? "high" : riskScore >= 40 ? "medium" : "low";

    const legalSteps = [
      "Demander un ecrit RH avec date de paiement confirmee.",
      "Envoyer une reclamation formelle avec preuve de reception.",
      "Conserver bulletins, contrat et preuves de presence.",
      "Saisir l'inspection du travail en cas d'absence de regularisation.",
    ];

    const possiblePenalties = [
      "Rappel integral des salaires dus.",
      "Penalites de retard selon base de reclamation.",
      "Risque contentieux pour l'employeur en cas de repetition.",
    ];

    const result = {
      riskScore,
      level,
      legalSteps,
      possiblePenalties,
    };

    await recordToolUsage("salary_delay_alert", input, result);

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
