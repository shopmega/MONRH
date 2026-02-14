import { NextResponse } from "next/server";
import { readAdminConfig } from "@/lib/server/admin-config";
import { isUserAuthenticated } from "@/lib/server/user-session";
import { canUseTool, resolveToolPolicy } from "@/lib/tools/tool-access";

export async function requireToolAccessOrResponse(toolId: string) {
  const [config, userAuthenticated] = await Promise.all([
    readAdminConfig(),
    isUserAuthenticated(),
  ]);
  const policy = resolveToolPolicy(config.toolPolicies, toolId);
  if (canUseTool(policy, userAuthenticated)) {
    return null;
  }
  return NextResponse.json(
    { ok: false, error: "tool_unavailable", toolId },
    { status: 403 },
  );
}
