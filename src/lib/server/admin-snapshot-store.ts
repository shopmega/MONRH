import { promises as fs } from "node:fs";
import path from "node:path";

export type AdminSnapshotKind = "rules" | "config";

export type AdminSnapshot = {
  id: string;
  kind: AdminSnapshotKind;
  createdAt: string;
  payload: unknown;
  note?: string;
};

type SnapshotStore = {
  snapshots: AdminSnapshot[];
};

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "admin-snapshots.json");
const DEFAULT_STORE: SnapshotStore = { snapshots: [] };

async function ensureStoreFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(STORE_PATH);
  } catch {
    await fs.writeFile(STORE_PATH, JSON.stringify(DEFAULT_STORE, null, 2), "utf8");
  }
}

async function readStore(): Promise<SnapshotStore> {
  await ensureStoreFile();
  const raw = await fs.readFile(STORE_PATH, "utf8");
  try {
    const parsed = JSON.parse(raw) as SnapshotStore;
    return { snapshots: parsed.snapshots ?? [] };
  } catch {
    return DEFAULT_STORE;
  }
}

async function writeStore(store: SnapshotStore) {
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

export async function addAdminSnapshot(input: {
  kind: AdminSnapshotKind;
  payload: unknown;
  note?: string;
}): Promise<AdminSnapshot> {
  const store = await readStore();
  const record: AdminSnapshot = {
    id: crypto.randomUUID(),
    kind: input.kind,
    createdAt: new Date().toISOString(),
    payload: input.payload,
    note: input.note,
  };
  store.snapshots = [record, ...store.snapshots].slice(0, 500);
  await writeStore(store);
  return record;
}

export async function listAdminSnapshots(kind?: AdminSnapshotKind): Promise<AdminSnapshot[]> {
  const store = await readStore();
  if (!kind) return store.snapshots;
  return store.snapshots.filter((item) => item.kind === kind);
}

export async function getAdminSnapshotById(id: string): Promise<AdminSnapshot | undefined> {
  const store = await readStore();
  return store.snapshots.find((item) => item.id === id);
}
