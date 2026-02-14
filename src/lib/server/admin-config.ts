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
    siteName: "Salarie.ma",
    siteDescription:
      "Simulateurs de droits des salaries au Maroc, generateurs de documents et articles juridiques clairs.",
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
    updatedAt: parsed.updatedAt ?? fallbackUpdatedAt,
  };
}

async function readAdminConfigFromSupabase(): Promise<AdminConfig | null> {
  try {
    const supabase = getSupabaseAdminClient() as any;
    const { data, error } = await supabase
      .from("app_settings")
      .select("value,updated_at")
      .eq("name", SETTINGS_KEY)
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

async function writeAdminConfigToSupabase(config: AdminConfig): Promise<AdminConfig | null> {
  try {
    const supabase = getSupabaseAdminClient() as any;
    const payload: Omit<AdminConfig, "updatedAt"> = {
      simulatorAdStepEnabled: config.simulatorAdStepEnabled,
      documentAdStepEnabled: config.documentAdStepEnabled,
      maintenanceMessage: config.maintenanceMessage,
      websiteSettings: config.websiteSettings,
      toolPolicies: config.toolPolicies,
    };
    const { data, error } = await supabase
      .from("app_settings")
      .upsert(
        {
          name: SETTINGS_KEY,
          value: payload,
          updated_at: config.updatedAt,
        },
        { onConflict: "name" },
      )
      .select("value,updated_at")
      .single();
    if (error) return null;
    const row = data as unknown as { value?: unknown; updated_at?: string | null };
    const rawValue =
      row.value && typeof row.value === "object" ? (row.value as Partial<AdminConfig>) : {};
    return normalizeConfig(rawValue, row.updated_at ?? config.updatedAt);
  } catch {
    return null;
  }
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
    updatedAt: new Date().toISOString(),
  };
  const persisted = await writeAdminConfigToSupabase(next);
  if (persisted) return persisted;
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(CONFIG_PATH, JSON.stringify(next, null, 2), "utf8");
  return next;
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
    updatedAt: new Date().toISOString(),
  };
  const persisted = await writeAdminConfigToSupabase(next);
  if (persisted) return persisted;
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(CONFIG_PATH, JSON.stringify(next, null, 2), "utf8");
  return next;
}
