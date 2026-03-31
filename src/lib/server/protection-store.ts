/* eslint-disable @typescript-eslint/no-explicit-any */
import { getSupabaseAdminClient } from "@/lib/server/supabase-admin";

export type ViolationLog = {
  id: string;
  createdAt: string;
  type: string;
  description: string;
  occurredAt: string;
};

export type OvertimeLog = {
  id: string;
  createdAt: string;
  workDate: string;
  hoursDay: number;
  hoursNight: number;
  hoursWeekend: number;
  hoursHoliday: number;
  proofUrl?: string;
  note?: string;
};

function requireUserId(userId: string | undefined) {
  if (!userId || userId.trim().length === 0) {
    throw new Error("user_not_authenticated");
  }
  return userId;
}

export async function listViolationLogs(userId?: string) {
  const supabase = getSupabaseAdminClient() as any;
  let query = supabase
    .from("user_violation_logs")
    .select("id, created_at, type, description, occurred_at")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (userId) {
    query = query.eq("user_id", userId);
  }
  const { data, error } = await query;
  if (error || !data) {
    throw new Error(error?.message ?? "violation_list_failed");
  }
  return (data as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    createdAt: String(row.created_at),
    type: String(row.type),
    description: String(row.description),
    occurredAt: String(row.occurred_at),
  }));
}

export async function addViolationLog(
  input: Omit<ViolationLog, "id" | "createdAt">,
  userId?: string,
): Promise<ViolationLog> {
  const owner = requireUserId(userId);
  const supabase = getSupabaseAdminClient() as any;
  const { data, error } = await supabase
    .from("user_violation_logs")
    .insert({
      user_id: owner,
      type: input.type,
      description: input.description,
      occurred_at: input.occurredAt,
    })
    .select("id, created_at, type, description, occurred_at")
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? "violation_insert_failed");
  }
  const row = data as Record<string, unknown>;
  return {
    id: String(row.id),
    createdAt: String(row.created_at),
    type: String(row.type),
    description: String(row.description),
    occurredAt: String(row.occurred_at),
  };
}

export async function listOvertimeLogs(userId?: string) {
  const supabase = getSupabaseAdminClient() as any;
  let query = supabase
    .from("user_overtime_logs")
    .select(
      "id, created_at, work_date, hours_day, hours_night, hours_weekend, hours_holiday, proof_url, note",
    )
    .order("created_at", { ascending: false })
    .limit(1000);
  if (userId) {
    query = query.eq("user_id", userId);
  }
  const { data, error } = await query;
  if (error || !data) {
    throw new Error(error?.message ?? "overtime_list_failed");
  }
  return (data as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    createdAt: String(row.created_at),
    workDate: String(row.work_date),
    hoursDay: Number(row.hours_day),
    hoursNight: Number(row.hours_night),
    hoursWeekend: Number(row.hours_weekend),
    hoursHoliday: Number(row.hours_holiday),
    proofUrl: typeof row.proof_url === "string" ? row.proof_url : undefined,
    note: typeof row.note === "string" ? row.note : undefined,
  }));
}

export async function addOvertimeLog(
  input: Omit<OvertimeLog, "id" | "createdAt">,
  userId?: string,
): Promise<OvertimeLog> {
  const owner = requireUserId(userId);
  const supabase = getSupabaseAdminClient() as any;
  const { data, error } = await supabase
    .from("user_overtime_logs")
    .insert({
      user_id: owner,
      work_date: input.workDate,
      hours_day: input.hoursDay,
      hours_night: input.hoursNight,
      hours_weekend: input.hoursWeekend,
      hours_holiday: input.hoursHoliday,
      proof_url: input.proofUrl ?? null,
      note: input.note ?? null,
    })
    .select(
      "id, created_at, work_date, hours_day, hours_night, hours_weekend, hours_holiday, proof_url, note",
    )
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? "overtime_insert_failed");
  }
  const row = data as Record<string, unknown>;
  return {
    id: String(row.id),
    createdAt: String(row.created_at),
    workDate: String(row.work_date),
    hoursDay: Number(row.hours_day),
    hoursNight: Number(row.hours_night),
    hoursWeekend: Number(row.hours_weekend),
    hoursHoliday: Number(row.hours_holiday),
    proofUrl: typeof row.proof_url === "string" ? row.proof_url : undefined,
    note: typeof row.note === "string" ? row.note : undefined,
  };
}
