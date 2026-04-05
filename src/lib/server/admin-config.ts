import { promises as fs } from "node:fs";
import path from "node:path";
import { createDefaultToolPolicies, type ToolPolicy } from "@/lib/tools/tool-catalog";
import { getSupabaseAdminClient } from "@/lib/server/supabase-admin";

export type AdminConfig = {
  simulatorAdStepEnabled: boolean;
  documentAdStepEnabled: boolean;
  maintenanceMessage: string;
  websiteSettings: {
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
  toolPolicies: Record<string, ToolPolicy>;
  evidenceGovernance: {
    signedUrlTtlSeconds: number;
    retentionDays: number;
    maxUploadBytes: number;
    allowArchivedEvidenceDownload: boolean;
  };
  updatedAt: string;
};

const DATA_DIR = path.join(process.cwd(), "data");
const CONFIG_PATH = path.join(DATA_DIR, "admin-config.json");
const SETTINGS_KEY = "admin_config";

const DEFAULT_ADMIN_CONFIG: AdminConfig = {
  simulatorAdStepEnabled: true,
  documentAdStepEnabled: true,
  maintenanceMessage: "",
  websiteSettings: {
    siteName: "MON RH",
    siteDescription:
      "Salaire, CNSS, litiges et modeles RH pour les salaries au Maroc.",
    siteSubtitle: "Labour Clarity Platform",
    logoUrl: "",
    supportEmail: "",
    defaultArticleCoverUrl: "",
    socialLinks: {
      facebook: "",
      instagram: "",
      linkedin: "",
      x: "",
    },
  },
  toolPolicies: createDefaultToolPolicies(),
  evidenceGovernance: {
    signedUrlTtlSeconds: 60,
    retentionDays: 90,
    maxUploadBytes: 10 * 1024 * 1024,
    allowArchivedEvidenceDownload: false,
  },
  updatedAt: new Date(0).toISOString(),
};

async function ensureConfigFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(CONFIG_PATH);
  } catch {
    await fs.writeFile(CONFIG_PATH, JSON.stringify(DEFAULT_ADMIN_CONFIG, null, 2), "utf8");
  }
}

function normalizeConfig(
  parsed: Partial<AdminConfig>,
  fallbackUpdatedAt = DEFAULT_ADMIN_CONFIG.updatedAt,
): AdminConfig {
  const defaultPolicies = createDefaultToolPolicies();
  const storedPolicies = parsed.toolPolicies ?? {};
  const mergedPolicies = Object.fromEntries(
    Object.entries(defaultPolicies).map(([toolId, defaultPolicy]) => [
      toolId,
      {
        visible: storedPolicies[toolId]?.visible ?? defaultPolicy.visible,
        enabled: storedPolicies[toolId]?.enabled ?? defaultPolicy.enabled,
        audience: storedPolicies[toolId]?.audience ?? defaultPolicy.audience,
      },
    ]),
  );

  return {
    simulatorAdStepEnabled: parsed.simulatorAdStepEnabled ?? DEFAULT_ADMIN_CONFIG.simulatorAdStepEnabled,
    documentAdStepEnabled: parsed.documentAdStepEnabled ?? DEFAULT_ADMIN_CONFIG.documentAdStepEnabled,
    maintenanceMessage: parsed.maintenanceMessage ?? DEFAULT_ADMIN_CONFIG.maintenanceMessage,
    websiteSettings: {
      siteName: parsed.websiteSettings?.siteName ?? DEFAULT_ADMIN_CONFIG.websiteSettings.siteName,
      siteDescription:
        parsed.websiteSettings?.siteDescription ??
        DEFAULT_ADMIN_CONFIG.websiteSettings.siteDescription,
      siteSubtitle: parsed.websiteSettings?.siteSubtitle ?? DEFAULT_ADMIN_CONFIG.websiteSettings.siteSubtitle,
      logoUrl: parsed.websiteSettings?.logoUrl ?? DEFAULT_ADMIN_CONFIG.websiteSettings.logoUrl,
      supportEmail: parsed.websiteSettings?.supportEmail ?? DEFAULT_ADMIN_CONFIG.websiteSettings.supportEmail,
      defaultArticleCoverUrl:
        parsed.websiteSettings?.defaultArticleCoverUrl ?? DEFAULT_ADMIN_CONFIG.websiteSettings.defaultArticleCoverUrl,
      socialLinks: {
        facebook:
          parsed.websiteSettings?.socialLinks?.facebook ?? DEFAULT_ADMIN_CONFIG.websiteSettings.socialLinks.facebook,
        instagram:
          parsed.websiteSettings?.socialLinks?.instagram ?? DEFAULT_ADMIN_CONFIG.websiteSettings.socialLinks.instagram,
        linkedin:
          parsed.websiteSettings?.socialLinks?.linkedin ?? DEFAULT_ADMIN_CONFIG.websiteSettings.socialLinks.linkedin,
        x: parsed.websiteSettings?.socialLinks?.x ?? DEFAULT_ADMIN_CONFIG.websiteSettings.socialLinks.x,
      },
    },
    toolPolicies: mergedPolicies,
    evidenceGovernance: {
      signedUrlTtlSeconds:
        parsed.evidenceGovernance?.signedUrlTtlSeconds ??
        DEFAULT_ADMIN_CONFIG.evidenceGovernance.signedUrlTtlSeconds,
      retentionDays:
        parsed.evidenceGovernance?.retentionDays ??
        DEFAULT_ADMIN_CONFIG.evidenceGovernance.retentionDays,
      maxUploadBytes:
        parsed.evidenceGovernance?.maxUploadBytes ??
        DEFAULT_ADMIN_CONFIG.evidenceGovernance.maxUploadBytes,
      allowArchivedEvidenceDownload:
        parsed.evidenceGovernance?.allowArchivedEvidenceDownload ??
        DEFAULT_ADMIN_CONFIG.evidenceGovernance.allowArchivedEvidenceDownload,
    },
    updatedAt: parsed.updatedAt ?? fallbackUpdatedAt,
  };
}

async function readAdminConfigFromSupabase(): Promise<AdminConfig | null> {
  try {
    const appSettings = getSupabaseAdminClient().from("app_settings") as unknown as {
      select: (
        columns: string,
      ) => {
        eq: (column: string, value: string) => {
          maybeSingle: () => Promise<{
            data: { value?: unknown; updated_at?: string | null } | null;
            error: unknown;
          }>;
        };
      };
    };
    const { data, error } = await appSettings
      .select("value,updated_at")
      .eq("key", SETTINGS_KEY)
      .maybeSingle();
    if (error) return null;
    if (!data) return DEFAULT_ADMIN_CONFIG;

    const row = data as unknown as { value?: unknown; updated_at?: string | null };
    const rawValue =
      row.value && typeof row.value === "object" ? (row.value as Partial<AdminConfig>) : {};
    return normalizeConfig(rawValue, row.updated_at ?? DEFAULT_ADMIN_CONFIG.updatedAt);
  } catch {
    return null;
  }
}

async function writeAdminConfigToSupabase(config: AdminConfig): Promise<AdminConfig> {
  const appSettings = getSupabaseAdminClient().from("app_settings") as unknown as {
    upsert: (
      values: { key: string; value: unknown; updated_at: string },
      options: { onConflict: string },
    ) => {
      select: (columns: string) => {
        single: () => Promise<{
          data: { value?: unknown; updated_at?: string | null } | null;
          error: { message?: string } | null;
        }>;
      };
    };
  };
  const payload: Omit<AdminConfig, "updatedAt"> = {
    simulatorAdStepEnabled: config.simulatorAdStepEnabled,
    documentAdStepEnabled: config.documentAdStepEnabled,
    maintenanceMessage: config.maintenanceMessage,
    websiteSettings: config.websiteSettings,
    toolPolicies: config.toolPolicies,
    evidenceGovernance: config.evidenceGovernance,
  };
  const { data, error } = await appSettings
    .upsert(
      {
        key: SETTINGS_KEY,
        value: payload,
        updated_at: config.updatedAt,
      },
      { onConflict: "key" },
    )
    .select("value,updated_at")
    .single();
  if (error) {
    throw new Error(error.message ?? "app_settings_upsert_failed");
  }
  const row = data as unknown as { value?: unknown; updated_at?: string | null };
  const rawValue =
    row.value && typeof row.value === "object" ? (row.value as Partial<AdminConfig>) : {};
  return normalizeConfig(rawValue, row.updated_at ?? config.updatedAt);
}

async function readLegacyFileConfig(): Promise<AdminConfig> {
  await ensureConfigFile();
  const raw = await fs.readFile(CONFIG_PATH, "utf8");
  try {
    const parsed = JSON.parse(raw) as Partial<AdminConfig>;
    return normalizeConfig(parsed);
  } catch {
    return DEFAULT_ADMIN_CONFIG;
  }
}

export async function readAdminConfig(): Promise<AdminConfig> {
  const supabaseConfig = await readAdminConfigFromSupabase();
  if (supabaseConfig) return supabaseConfig;
  return readLegacyFileConfig();
}

export async function updateAdminConfig(
  patch: Partial<Omit<AdminConfig, "updatedAt">>,
): Promise<AdminConfig> {
  const current = await readAdminConfig();
  const next: AdminConfig = {
    simulatorAdStepEnabled:
      patch.simulatorAdStepEnabled ?? current.simulatorAdStepEnabled,
    documentAdStepEnabled:
      patch.documentAdStepEnabled ?? current.documentAdStepEnabled,
    maintenanceMessage: patch.maintenanceMessage ?? current.maintenanceMessage,
    websiteSettings: patch.websiteSettings ?? current.websiteSettings,
    toolPolicies: patch.toolPolicies ?? current.toolPolicies,
    evidenceGovernance: patch.evidenceGovernance ?? current.evidenceGovernance,
    updatedAt: new Date().toISOString(),
  };
  try {
    return await writeAdminConfigToSupabase(next);
  } catch (error) {
    // Local filesystem fallback is only acceptable outside production.
    if (process.env.NODE_ENV !== "production") {
      try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        await fs.writeFile(CONFIG_PATH, JSON.stringify(next, null, 2), "utf8");
        return next;
      } catch (fileError) {
        const message =
          fileError instanceof Error ? fileError.message : "unknown_persistence_error";
        throw new Error(`admin_config_persistence_failed: ${message}`);
      }
    }
    const message = error instanceof Error ? error.message : "app_settings_upsert_failed";
    throw new Error(`admin_config_persistence_failed: ${message}`);
  }
}

export async function replaceAdminConfig(
  payload: Omit<AdminConfig, "updatedAt">,
): Promise<AdminConfig> {
  const next: AdminConfig = {
    simulatorAdStepEnabled: payload.simulatorAdStepEnabled,
    documentAdStepEnabled: payload.documentAdStepEnabled,
    maintenanceMessage: payload.maintenanceMessage,
    websiteSettings: payload.websiteSettings,
    toolPolicies: payload.toolPolicies,
    evidenceGovernance: payload.evidenceGovernance,
    updatedAt: new Date().toISOString(),
  };
  try {
    return await writeAdminConfigToSupabase(next);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        await fs.writeFile(CONFIG_PATH, JSON.stringify(next, null, 2), "utf8");
        return next;
      } catch (fileError) {
        const message =
          fileError instanceof Error ? fileError.message : "unknown_persistence_error";
        throw new Error(`admin_config_persistence_failed: ${message}`);
      }
    }
    const message = error instanceof Error ? error.message : "app_settings_upsert_failed";
    throw new Error(`admin_config_persistence_failed: ${message}`);
  }
}
