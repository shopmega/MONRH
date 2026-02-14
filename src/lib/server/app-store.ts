/* eslint-disable @typescript-eslint/no-explicit-any */
import { getSupabaseAdminClient } from "@/lib/server/supabase-admin";

export type SavedSimulation = {
  id: string;
  createdAt: string;
  calculatorType: string;
  input: Record<string, unknown>;
  result: Record<string, unknown>;
};

export type SavedDocument = {
  id: string;
  createdAt: string;
  templateId: string;
  templateTitle: string;
  values: Record<string, string>;
  preview: string;
};

function requireUserId(userId: string | undefined) {
  if (!userId || userId.trim().length === 0) {
    throw new Error("user_not_authenticated");
  }
  return userId;
}

export async function addSimulation(
  simulation: Omit<SavedSimulation, "id" | "createdAt">,
  userId?: string,
): Promise<SavedSimulation> {
  const owner = requireUserId(userId);
  const supabase = getSupabaseAdminClient() as any;
  const { data, error } = await supabase
    .from("user_simulations")
    .insert({
      user_id: owner,
      calculator_type: simulation.calculatorType,
      input_payload: simulation.input,
      result_payload: simulation.result,
    })
    .select("id, created_at, calculator_type, input_payload, result_payload")
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? "simulation_insert_failed");
  }
  const row = data as Record<string, unknown>;
  return {
    id: String(row.id),
    createdAt: String(row.created_at),
    calculatorType: String(row.calculator_type),
    input: (row.input_payload as Record<string, unknown>) ?? {},
    result: (row.result_payload as Record<string, unknown>) ?? {},
  };
}

export async function listSimulations(userId?: string): Promise<SavedSimulation[]> {
  const supabase = getSupabaseAdminClient() as any;
  let query = supabase
    .from("user_simulations")
    .select("id, created_at, calculator_type, input_payload, result_payload")
    .order("created_at", { ascending: false })
    .limit(500);
  if (userId) {
    query = query.eq("user_id", userId);
  }
  const { data, error } = await query;
  if (error || !data) {
    throw new Error(error?.message ?? "simulation_list_failed");
  }
  return (data as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    createdAt: String(row.created_at),
    calculatorType: String(row.calculator_type),
    input: (row.input_payload as Record<string, unknown>) ?? {},
    result: (row.result_payload as Record<string, unknown>) ?? {},
  }));
}

export async function getSimulationById(
  simulationId: string,
  userId?: string,
): Promise<SavedSimulation | null> {
  const owner = requireUserId(userId);
  const supabase = getSupabaseAdminClient() as any;
  const { data, error } = await supabase
    .from("user_simulations")
    .select("id, created_at, calculator_type, input_payload, result_payload")
    .eq("id", simulationId)
    .eq("user_id", owner)
    .maybeSingle();
  if (error) {
    throw new Error(error.message ?? "simulation_get_failed");
  }
  if (!data) return null;

  const row = data as Record<string, unknown>;
  return {
    id: String(row.id),
    createdAt: String(row.created_at),
    calculatorType: String(row.calculator_type),
    input: (row.input_payload as Record<string, unknown>) ?? {},
    result: (row.result_payload as Record<string, unknown>) ?? {},
  };
}

export async function addDocument(
  document: Omit<SavedDocument, "id" | "createdAt">,
  userId?: string,
): Promise<SavedDocument> {
  const owner = requireUserId(userId);
  const supabase = getSupabaseAdminClient() as any;
  const { data, error } = await supabase
    .from("user_documents")
    .insert({
      user_id: owner,
      template_id: document.templateId,
      template_title: document.templateTitle,
      values_payload: document.values,
      preview_text: document.preview,
    })
    .select("id, created_at, template_id, template_title, values_payload, preview_text")
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? "document_insert_failed");
  }
  const row = data as Record<string, unknown>;
  return {
    id: String(row.id),
    createdAt: String(row.created_at),
    templateId: String(row.template_id),
    templateTitle: String(row.template_title),
    values: (row.values_payload as Record<string, string>) ?? {},
    preview: String(row.preview_text ?? ""),
  };
}

export async function listDocuments(userId?: string): Promise<SavedDocument[]> {
  const supabase = getSupabaseAdminClient() as any;
  let query = supabase
    .from("user_documents")
    .select("id, created_at, template_id, template_title, values_payload, preview_text")
    .order("created_at", { ascending: false })
    .limit(500);
  if (userId) {
    query = query.eq("user_id", userId);
  }
  const { data, error } = await query;
  if (error || !data) {
    throw new Error(error?.message ?? "document_list_failed");
  }
  return (data as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    createdAt: String(row.created_at),
    templateId: String(row.template_id),
    templateTitle: String(row.template_title),
    values: (row.values_payload as Record<string, string>) ?? {},
    preview: String(row.preview_text ?? ""),
  }));
}
