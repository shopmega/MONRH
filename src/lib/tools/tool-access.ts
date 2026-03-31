import type { ToolPolicy } from "@/lib/tools/tool-catalog";

export function resolveToolPolicy(
  policies: Record<string, ToolPolicy> | undefined,
  toolId: string,
): ToolPolicy {
  const policy = policies?.[toolId];
  return policy ?? { visible: true, enabled: true, audience: "public" };
}

export function canUseTool(
  policy: ToolPolicy,
  userAuthenticated: boolean,
): boolean {
  if (!policy.visible || !policy.enabled) return false;
  if (policy.audience === "logged" && !userAuthenticated) return false;
  return true;
}
