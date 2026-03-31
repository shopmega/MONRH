import { describe, expect, it } from "vitest";
import { simulateHarassmentScenario } from "@/lib/calculators/harassment-scenario";

describe("simulateHarassmentScenario", () => {
  it("scores dossier readiness", () => {
    const result = simulateHarassmentScenario({
      calculationDate: "2026-02-12",
      incidentsCount: 8,
      witnessesCount: 2,
      hasWrittenProof: true,
      hasMedicalProof: false,
    });

    expect(result.breakdown.dossierStrengthScore).toBeGreaterThan(0);
    expect(result.breakdown.recommendedEscalationLevel.length).toBeGreaterThan(0);
  });
});
