import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/server/admin-auth";
import { addAdminAuditEvent } from "@/lib/server/admin-audit-store";
import { addAdminSnapshot } from "@/lib/server/admin-snapshot-store";
import { readAdminConfig, updateAdminConfig } from "@/lib/server/admin-config";
import { isSameOriginRequest } from "@/lib/server/csrf";
import type { ToolPolicy } from "@/lib/tools/tool-catalog";

const toolPolicySchema = z.object({
  visible: z.boolean(),
  enabled: z.boolean(),
  audience: z.enum(["public", "logged"]),
});

const configPatchSchema = z.object({
  simulatorAdStepEnabled: z.boolean().optional(),
  documentAdStepEnabled: z.boolean().optional(),
  maintenanceMessage: z.string().optional(),
  websiteSettings: z
    .object({
      siteName: z.string(),
      siteDescription: z.string(),
      siteSubtitle: z.string(),
      logoUrl: z.string(),
      supportEmail: z.string(),
      defaultArticleCoverUrl: z.string(),
      socialLinks: z.object({
        facebook: z.string(),
        instagram: z.string(),
        linkedin: z.string(),
        x: z.string(),
      }),
    })
    .optional(),
  toolPolicies: z.record(z.string(), toolPolicySchema).optional(),
  evidenceGovernance: z
    .object({
      signedUrlTtlSeconds: z.number().int().min(30).max(900),
      retentionDays: z.number().int().min(1).max(3650),
      maxUploadBytes: z.number().int().min(1024 * 1024).max(50 * 1024 * 1024),
      allowArchivedEvidenceDownload: z.boolean(),
    })
    .optional(),
});

export async function GET() {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const config = await readAdminConfig();
  return NextResponse.json({ ok: true, config });
}

export async function PUT(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ ok: false, error: "invalid_origin" }, { status: 403 });
  }
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = configPatchSchema.parse((await request.json()) as unknown) as {
      simulatorAdStepEnabled?: boolean;
      documentAdStepEnabled?: boolean;
      maintenanceMessage?: string;
      websiteSettings?: {
        siteName: string;
        siteDescription: string;
        siteSubtitle: string;
        logoUrl: string;
        supportEmail: string;
        defaultArticleCoverUrl: string;
        socialLinks: {
          facebook: string;
          instagram: string;
          linkedin: string;
          x: string;
        };
      };
      toolPolicies?: Record<string, ToolPolicy>;
      evidenceGovernance?: {
        signedUrlTtlSeconds: number;
        retentionDays: number;
        maxUploadBytes: number;
        allowArchivedEvidenceDownload: boolean;
      };
    };

    const current = await readAdminConfig();
    await addAdminSnapshot({
      kind: "config",
      payload: current,
      note: "before_config_update",
    });

    const config = await updateAdminConfig({
      simulatorAdStepEnabled: body.simulatorAdStepEnabled,
      documentAdStepEnabled: body.documentAdStepEnabled,
      maintenanceMessage: body.maintenanceMessage,
      websiteSettings: body.websiteSettings,
      toolPolicies: body.toolPolicies,
      evidenceGovernance: body.evidenceGovernance,
    });

    await addAdminAuditEvent({
      action: "admin_config_update",
      status: "success",
      meta: {
        simulatorAdStepEnabled: config.simulatorAdStepEnabled,
        documentAdStepEnabled: config.documentAdStepEnabled,
        evidenceGovernance: config.evidenceGovernance,
      },
    });

    return NextResponse.json({ ok: true, config });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    await addAdminAuditEvent({
      action: "admin_config_update",
      status: "failed",
      meta: {
        error: message,
      },
    });
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "invalid_payload", message }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: "config_update_failed", message }, { status: 500 });
  }
}
