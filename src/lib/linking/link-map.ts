import { promises as fs } from "node:fs";
import path from "node:path";
import { getPublicSupabaseAdminClient } from "@/lib/server/supabase-admin";

export type LinkSourceType = "article" | "simulator" | "document";

export type LinkTargets = {
  articleSlugs: string[];
  toolIds: string[];
  documentIds: string[];
};

export type LinkMapData = {
  article: Record<string, LinkTargets>;
  simulator: Record<string, LinkTargets>;
  document: Record<string, LinkTargets>;
  updatedAt: string;
};

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "link-map.json");
const SETTINGS_KEY = "link_map";

const EMPTY_TARGETS: LinkTargets = {
  articleSlugs: [],
  toolIds: [],
  documentIds: [],
};

const DEFAULT_LINK_MAP: LinkMapData = {
  article: {},
  simulator: {},
  document: {},
  updatedAt: new Date(0).toISOString(),
};

function normalizeTargets(input?: Partial<LinkTargets>): LinkTargets {
  const uniq = (items: string[] | undefined) =>
    Array.from(new Set((items ?? []).map((item) => item.trim()).filter(Boolean)));
  return {
    articleSlugs: uniq(input?.articleSlugs),
    toolIds: uniq(input?.toolIds),
    documentIds: uniq(input?.documentIds),
  };
}

async function ensureStoreFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(STORE_PATH);
  } catch {
    await fs.writeFile(STORE_PATH, JSON.stringify(DEFAULT_LINK_MAP, null, 2), "utf8");
  }
}

async function readLinkMapFromSupabase(): Promise<LinkMapData | null> {
  try {
    const appSettings = getPublicSupabaseAdminClient().from("app_settings") as unknown as {
      select: (
        columns: string,
      ) => {
        eq: (column: string, value: string) => {
          maybeSingle: () => Promise<{
            data: { value?: unknown } | null;
            error: unknown;
          }>;
        };
      };
    };
    let { data, error } = await appSettings
      .select("value")
      .eq("key", SETTINGS_KEY)
      .maybeSingle();
    if (error) {
      const fallback = await appSettings.select("value").eq("name", SETTINGS_KEY).maybeSingle();
      data = fallback.data;
      error = fallback.error;
    }
    if (error) return null;
    if (!data) return DEFAULT_LINK_MAP;

    const row = data as { value?: unknown };
    const parsed = (row.value ?? {}) as Partial<LinkMapData>;
    const normalizeRecord = (record?: Record<string, LinkTargets>) =>
      Object.fromEntries(
        Object.entries(record ?? {}).map(([key, value]) => [key, normalizeTargets(value)]),
      );
    return {
      article: normalizeRecord(parsed.article),
      simulator: normalizeRecord(parsed.simulator),
      document: normalizeRecord(parsed.document),
      updatedAt: parsed.updatedAt ?? DEFAULT_LINK_MAP.updatedAt,
    };
  } catch {
    return null;
  }
}

async function writeLinkMapToSupabase(map: LinkMapData): Promise<LinkMapData | null> {
  try {
    const appSettings = getPublicSupabaseAdminClient().from("app_settings") as unknown as {
      upsert: (
        values: { key?: string; name?: string; value: unknown; updated_at: string },
        options: { onConflict: string },
      ) => {
        select: (columns: string) => {
          single: () => Promise<{
            data: { value?: unknown } | null;
            error: unknown;
          }>;
        };
      };
    };
    let { data, error } = await appSettings
      .upsert(
        {
          key: SETTINGS_KEY,
          value: map,
          updated_at: map.updatedAt,
        },
        { onConflict: "key" },
      )
      .select("value")
      .single();
    if (error) {
      const fallback = await appSettings
        .upsert(
          {
            name: SETTINGS_KEY,
            value: map,
            updated_at: map.updatedAt,
          },
          { onConflict: "name" },
        )
        .select("value")
        .single();
      data = fallback.data;
      error = fallback.error;
    }
    if (error) return null;
    const row = data as { value?: unknown };
    const parsed = (row.value ?? {}) as Partial<LinkMapData>;
    return {
      article: (parsed.article ?? {}) as Record<string, LinkTargets>,
      simulator: (parsed.simulator ?? {}) as Record<string, LinkTargets>,
      document: (parsed.document ?? {}) as Record<string, LinkTargets>,
      updatedAt: parsed.updatedAt ?? map.updatedAt,
    };
  } catch {
    return null;
  }
}

export async function readLinkMap(): Promise<LinkMapData> {
  const supabaseMap = await readLinkMapFromSupabase();
  if (supabaseMap) return supabaseMap;

  await ensureStoreFile();
  const raw = await fs.readFile(STORE_PATH, "utf8");
  try {
    const parsed = JSON.parse(raw) as Partial<LinkMapData>;
    const normalizeRecord = (record?: Record<string, LinkTargets>) =>
      Object.fromEntries(
        Object.entries(record ?? {}).map(([key, value]) => [key, normalizeTargets(value)]),
      );
    return {
      article: normalizeRecord(parsed.article),
      simulator: normalizeRecord(parsed.simulator),
      document: normalizeRecord(parsed.document),
      updatedAt: parsed.updatedAt ?? DEFAULT_LINK_MAP.updatedAt,
    };
  } catch {
    return DEFAULT_LINK_MAP;
  }
}

export async function getLinkTargets(
  sourceType: LinkSourceType,
  sourceId: string,
): Promise<LinkTargets> {
  const map = await readLinkMap();
  return map[sourceType][sourceId] ?? EMPTY_TARGETS;
}

export async function upsertLinkTargets(input: {
  sourceType: LinkSourceType;
  sourceId: string;
  targets: Partial<LinkTargets>;
}): Promise<LinkMapData> {
  const current = await readLinkMap();
  const sourceId = input.sourceId.trim();
  if (!sourceId) {
    return current;
  }

  const nextTargets = normalizeTargets(input.targets);
  const next: LinkMapData = {
    ...current,
    [input.sourceType]: {
      ...current[input.sourceType],
      [sourceId]: nextTargets,
    },
    updatedAt: new Date().toISOString(),
  };

  const persisted = await writeLinkMapToSupabase(next);
  if (persisted) return persisted;
  await fs.writeFile(STORE_PATH, JSON.stringify(next, null, 2), "utf8");
  return next;
}

export async function deleteLinkTargets(input: {
  sourceType: LinkSourceType;
  sourceId: string;
}): Promise<LinkMapData> {
  const current = await readLinkMap();
  const sourceId = input.sourceId.trim();
  if (!sourceId) {
    return current;
  }
  const record = { ...current[input.sourceType] };
  delete record[sourceId];
  const next: LinkMapData = {
    ...current,
    [input.sourceType]: record,
    updatedAt: new Date().toISOString(),
  };
  const persisted = await writeLinkMapToSupabase(next);
  if (persisted) return persisted;
  await fs.writeFile(STORE_PATH, JSON.stringify(next, null, 2), "utf8");
  return next;
}
