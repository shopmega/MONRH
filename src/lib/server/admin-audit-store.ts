import { promises as fs } from "node:fs";
import path from "node:path";

export type AdminAuditEvent = {
  id: string;
  createdAt: string;
  action: string;
  status: "success" | "failed";
  meta?: Record<string, unknown>;
};

type AuditStore = {
  events: AdminAuditEvent[];
};

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "admin-audit.json");
const DEFAULT_STORE: AuditStore = { events: [] };

async function ensureStoreFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(STORE_PATH);
  } catch {
    await fs.writeFile(STORE_PATH, JSON.stringify(DEFAULT_STORE, null, 2), "utf8");
  }
}

async function readStore(): Promise<AuditStore> {
  await ensureStoreFile();
  const raw = await fs.readFile(STORE_PATH, "utf8");
  try {
    const parsed = JSON.parse(raw) as AuditStore;
    return { events: parsed.events ?? [] };
  } catch {
    return DEFAULT_STORE;
  }
}

async function writeStore(store: AuditStore) {
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

export async function addAdminAuditEvent(
  event: Omit<AdminAuditEvent, "id" | "createdAt">,
): Promise<AdminAuditEvent> {
  const store = await readStore();
  const record: AdminAuditEvent = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...event,
  };
  store.events = [record, ...store.events].slice(0, 3000);
  await writeStore(store);
  return record;
}

export async function listAdminAuditEvents(): Promise<AdminAuditEvent[]> {
  const store = await readStore();
  return store.events;
}
