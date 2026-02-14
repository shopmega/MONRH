import { NextResponse } from "next/server";
import { readAdminConfig } from "@/lib/server/admin-config";
import { isUserAuthenticated } from "@/lib/server/user-session";

export async function GET() {
  const [config, userAuthenticated] = await Promise.all([
    readAdminConfig(),
    isUserAuthenticated(),
  ]);
  return NextResponse.json({
    ok: true,
    config: {
      simulatorAdStepEnabled: config.simulatorAdStepEnabled,
      documentAdStepEnabled: config.documentAdStepEnabled,
      maintenanceMessage: config.maintenanceMessage,
      websiteSettings: config.websiteSettings,
      toolPolicies: config.toolPolicies,
      userAuthenticated,
      updatedAt: config.updatedAt,
    },
  });
}
