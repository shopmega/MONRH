import { promises as fs } from "node:fs";
import path from "node:path";

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

export async function readLinkMap(): Promise<LinkMapData> {
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
  await fs.writeFile(STORE_PATH, JSON.stringify(next, null, 2), "utf8");
  return next;
}
