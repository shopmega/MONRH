"use client";

import type { AudienceMode } from "@/lib/audience/audience-mode";

type GenericSimulationResult = {
  versionCode: string;
  breakdown: Record<string, string | number | boolean>;
  explanation?: {
    summary: string;
    assumptions: string[];
    formulas: string[];
    warnings: string[];
    nextSteps: string[];
    confidence?: {
      level: "low" | "medium" | "high";
      label?: string;
      note: string;
    };
    sources?: string[];
    missingInformation?: string[];
  };
};

export type SimulationResultSnapshot = {
  calculatorPath: string;
  calculatorType: string;
  title: string;
  description: string;
  generatedAt?: string;
  breakdownLabels: Record<string, string>;
  units: Record<string, string>;
  locale: string;
  audienceMode?: AudienceMode;
  inputPayload?: Record<string, unknown>;
  result: GenericSimulationResult;
};

const STORAGE_KEY = "salarie_last_simulation_result";

function parseSnapshot(raw: string | null): SimulationResultSnapshot | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SimulationResultSnapshot;
  } catch {
    return null;
  }
}

export function writeSimulationResultSnapshot(snapshot: SimulationResultSnapshot) {
  if (typeof window === "undefined") return;
  const serialized = JSON.stringify(snapshot);
  window.sessionStorage.setItem(STORAGE_KEY, serialized);
  window.localStorage.setItem(STORAGE_KEY, serialized);
}

export function readSimulationResultSnapshot() {
  if (typeof window === "undefined") return null;
  const session = parseSnapshot(window.sessionStorage.getItem(STORAGE_KEY));
  if (session) return session;
  return parseSnapshot(window.localStorage.getItem(STORAGE_KEY));
}
