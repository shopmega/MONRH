import { NextRequest, NextResponse } from "next/server";
import { requireToolAccessOrResponse } from "@/lib/server/tool-access-enforcement";
import {
  buildPreLitigationTimeline,
  preLitigationTimelineInputSchema,
} from "@/lib/tools/pre-litigation-timeline";
import { recordToolUsage } from "@/lib/server/tool-usage-history";

export async function POST(request: NextRequest) {
  const accessDenied = await requireToolAccessOrResponse("pre_litigation_timeline");
  if (accessDenied) return accessDenied;
  try {
    const payload = await request.json();
    const input = preLitigationTimelineInputSchema.parse(payload);
    const result = buildPreLitigationTimeline(input);

    await recordToolUsage("pre_litigation_timeline", input, result);

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
