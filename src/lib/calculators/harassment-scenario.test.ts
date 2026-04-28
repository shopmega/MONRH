import { describe, expect, it } from "vitest";
import { simulateHarassmentScenario, harassmentScenarioInputSchema } from "@/lib/calculators/harassment-scenario";
import { getCurrentDateISO } from "@/lib/calculators/shared";

describe("harassmentScenarioInputSchema", () => {
  it("validates correct input", () => {
    const validInput = {
      calculationDate: "2026-02-12",
      harassmentType: "moral" as const,
      perpetratorRelationship: "supervisor" as const,
      incidentsCount: 5,
      witnessesCount: 2,
      hasWrittenProof: true,
      hasMedicalProof: false,
      hrNotified: true,
      companySize: "large" as const,
    };

    expect(() => harassmentScenarioInputSchema.parse(validInput)).not.toThrow();
  });

  it("applies default values", () => {
    const minimalInput = {
      incidentsCount: 1,
    };

    const parsed = harassmentScenarioInputSchema.parse(minimalInput);
    expect(parsed.calculationDate).toBe(getCurrentDateISO());
    expect(parsed.harassmentType).toBe("moral");
    expect(parsed.perpetratorRelationship).toBe("supervisor");
    expect(parsed.witnessesCount).toBe(0);
    expect(parsed.hasWrittenProof).toBe(false);
    expect(parsed.hasMedicalProof).toBe(false);
    expect(parsed.hrNotified).toBe(false);
    expect(parsed.companySize).toBe("large");
  });

  it("validates incidents count bounds", () => {
    const validInput = { incidentsCount: 5 };
    expect(() => harassmentScenarioInputSchema.parse(validInput)).not.toThrow();

    const tooFew = { incidentsCount: 0 };
    expect(() => harassmentScenarioInputSchema.parse(tooFew)).toThrow();

    const tooMany = { incidentsCount: 201 };
    expect(() => harassmentScenarioInputSchema.parse(tooMany)).toThrow();
  });

  it("validates witnesses count bounds", () => {
    const validInput = { incidentsCount: 1, witnessesCount: 25 };
    expect(() => harassmentScenarioInputSchema.parse(validInput)).not.toThrow();

    const tooFew = { incidentsCount: 1, witnessesCount: -1 };
    expect(() => harassmentScenarioInputSchema.parse(tooFew)).toThrow();

    const tooMany = { incidentsCount: 1, witnessesCount: 51 };
    expect(() => harassmentScenarioInputSchema.parse(tooMany)).toThrow();
  });
});

describe("simulateHarassmentScenario", () => {
  it("scores dossier readiness with basic scenario", () => {
    const result = simulateHarassmentScenario({
      calculationDate: "2026-02-12",
      incidentsCount: 8,
      witnessesCount: 2,
      hasWrittenProof: true,
      hasMedicalProof: false,
      harassmentType: "moral",
      perpetratorRelationship: "supervisor",
      hrNotified: false,
      companySize: "large",
    });

    expect(result.breakdown.dossierStrengthScore).toBeGreaterThan(0);
    expect(result.breakdown.recommendedEscalationLevel.length).toBeGreaterThan(0);
    expect(result.versionId).toBe("ma_2026");
    expect(result.versionCode).toBe("ma_2026");
  });

  it("calculates higher score for sexual harassment", () => {
    const moralResult = simulateHarassmentScenario({
      calculationDate: "2026-02-12",
      incidentsCount: 5,
      witnessesCount: 1,
      hasWrittenProof: true,
      hasMedicalProof: false,
      harassmentType: "moral",
      perpetratorRelationship: "supervisor",
      hrNotified: false,
      companySize: "large",
    });

    const sexualResult = simulateHarassmentScenario({
      calculationDate: "2026-02-12",
      incidentsCount: 5,
      witnessesCount: 1,
      hasWrittenProof: true,
      hasMedicalProof: false,
      harassmentType: "sexual",
      perpetratorRelationship: "supervisor",
      hrNotified: false,
      companySize: "large",
    });

    expect(sexualResult.breakdown.dossierStrengthScore).toBeGreaterThan(moralResult.breakdown.dossierStrengthScore);
  });

  it("calculates higher score for supervisor perpetrator", () => {
    const colleagueResult = simulateHarassmentScenario({
      calculationDate: "2026-02-12",
      incidentsCount: 5,
      witnessesCount: 1,
      hasWrittenProof: true,
      hasMedicalProof: false,
      harassmentType: "moral",
      perpetratorRelationship: "colleague",
      hrNotified: false,
      companySize: "large",
    });

    const supervisorResult = simulateHarassmentScenario({
      calculationDate: "2026-02-12",
      incidentsCount: 5,
      witnessesCount: 1,
      hasWrittenProof: true,
      hasMedicalProof: false,
      harassmentType: "moral",
      perpetratorRelationship: "supervisor",
      hrNotified: false,
      companySize: "large",
    });

    expect(supervisorResult.breakdown.dossierStrengthScore).toBeGreaterThan(colleagueResult.breakdown.dossierStrengthScore);
  });

  it("calculates higher score when HR notified", () => {
    const notNotifiedResult = simulateHarassmentScenario({
      calculationDate: "2026-02-12",
      incidentsCount: 5,
      witnessesCount: 1,
      hasWrittenProof: true,
      hasMedicalProof: false,
      harassmentType: "moral",
      perpetratorRelationship: "supervisor",
      hrNotified: false,
      companySize: "large",
    });

    const notifiedResult = simulateHarassmentScenario({
      calculationDate: "2026-02-12",
      incidentsCount: 5,
      witnessesCount: 1,
      hasWrittenProof: true,
      hasMedicalProof: false,
      harassmentType: "moral",
      perpetratorRelationship: "supervisor",
      hrNotified: true,
      companySize: "large",
    });

    expect(notNotifiedResult.breakdown.dossierStrengthScore).toBeLessThan(notifiedResult.breakdown.dossierStrengthScore);
  });

  it("applies penalty for small companies", () => {
    const largeCompanyResult = simulateHarassmentScenario({
      calculationDate: "2026-02-12",
      incidentsCount: 5,
      witnessesCount: 1,
      hasWrittenProof: true,
      hasMedicalProof: false,
      harassmentType: "moral",
      perpetratorRelationship: "supervisor",
      hrNotified: false,
      companySize: "large",
    });

    const smallCompanyResult = simulateHarassmentScenario({
      calculationDate: "2026-02-12",
      incidentsCount: 5,
      witnessesCount: 1,
      hasWrittenProof: true,
      hasMedicalProof: false,
      harassmentType: "moral",
      perpetratorRelationship: "supervisor",
      hrNotified: false,
      companySize: "small",
    });

    expect(smallCompanyResult.breakdown.dossierStrengthScore).toBeLessThan(largeCompanyResult.breakdown.dossierStrengthScore);
  });

  it("caps score at 100", () => {
    const result = simulateHarassmentScenario({
      calculationDate: "2026-02-12",
      incidentsCount: 200, // max 40 points
      witnessesCount: 50,  // max 24 points
      hasWrittenProof: true, // 20 points
      hasMedicalProof: true,  // 12 points
      harassmentType: "sexual", // 10 points
      perpetratorRelationship: "supervisor", // 8 points
      hrNotified: true, // 12 points
      companySize: "large",
    });

    expect(result.breakdown.dossierStrengthScore).toBe(100);
    expect(result.breakdown.evidenceReadinessPercent).toBe(100);
  });

  it("ensures minimum score of 0", () => {
    const result = simulateHarassmentScenario({
      calculationDate: "2026-02-12",
      incidentsCount: 1,
      witnessesCount: 0,
      hasWrittenProof: false,
      hasMedicalProof: false,
      harassmentType: "moral",
      perpetratorRelationship: "supervisor",
      hrNotified: false,
      companySize: "small", // -10 penalty
    });

    expect(result.breakdown.dossierStrengthScore).toBeGreaterThanOrEqual(0);
    expect(result.breakdown.evidenceReadinessPercent).toBeGreaterThanOrEqual(0);
  });

  it("generates appropriate priority actions", () => {
    const result = simulateHarassmentScenario({
      calculationDate: "2026-02-12",
      incidentsCount: 5,
      witnessesCount: 1,
      hasWrittenProof: false,
      hasMedicalProof: false,
      harassmentType: "sexual",
      perpetratorRelationship: "supervisor",
      hrNotified: false,
      companySize: "large",
    });

    expect(result.breakdown.priorityActions).toContain("Constituer des preuves ecrites (emails, SMS, journal date).");
    expect(result.breakdown.priorityActions).toContain("Signaler formellement au RH ou responsable hierarchique superieur.");
    expect(result.breakdown.priorityActions).toContain("Formaliser le signalement par ecrit avec accusé de reception.");
    expect(result.breakdown.priorityActions).toContain("Contacter le Conseil National des Droits de l'Homme (CNDH) si besoin.");
  });

  it("provides correct escalation levels for sexual harassment", () => {
    const lowScore = simulateHarassmentScenario({
      calculationDate: "2026-02-12",
      incidentsCount: 1,
      witnessesCount: 0,
      hasWrittenProof: false,
      hasMedicalProof: false,
      harassmentType: "sexual",
      perpetratorRelationship: "supervisor",
      hrNotified: false,
      companySize: "large",
    });

    const mediumScore = simulateHarassmentScenario({
      calculationDate: "2026-02-12",
      incidentsCount: 10,
      witnessesCount: 3,
      hasWrittenProof: true,
      hasMedicalProof: false,
      harassmentType: "sexual",
      perpetratorRelationship: "supervisor",
      hrNotified: false,
      companySize: "large",
    });

    const highScore = simulateHarassmentScenario({
      calculationDate: "2026-02-12",
      incidentsCount: 50,
      witnessesCount: 10,
      hasWrittenProof: true,
      hasMedicalProof: true,
      harassmentType: "sexual",
      perpetratorRelationship: "supervisor",
      hrNotified: false,
      companySize: "large",
    });

    expect(lowScore.breakdown.recommendedEscalationLevel).toBe("Signalement RH + dossier de preuves urgent");
    expect(mediumScore.breakdown.recommendedEscalationLevel).toBe("Plainte penale immediate + assistance juridique");
    expect(highScore.breakdown.recommendedEscalationLevel).toBe("Plainte penale immediate + assistance juridique");
  });

  it("provides correct escalation levels for moral harassment", () => {
    const lowScore = simulateHarassmentScenario({
      calculationDate: "2026-02-12",
      incidentsCount: 1,
      witnessesCount: 0,
      hasWrittenProof: false,
      hasMedicalProof: false,
      harassmentType: "moral",
      perpetratorRelationship: "supervisor",
      hrNotified: false,
      companySize: "large",
    });

    const mediumScore = simulateHarassmentScenario({
      calculationDate: "2026-02-12",
      incidentsCount: 10,
      witnessesCount: 3,
      hasWrittenProof: true,
      hasMedicalProof: false,
      harassmentType: "moral",
      perpetratorRelationship: "supervisor",
      hrNotified: false,
      companySize: "large",
    });

    const highScore = simulateHarassmentScenario({
      calculationDate: "2026-02-12",
      incidentsCount: 50,
      witnessesCount: 10,
      hasWrittenProof: true,
      hasMedicalProof: true,
      harassmentType: "moral",
      perpetratorRelationship: "supervisor",
      hrNotified: false,
      companySize: "large",
    });

    expect(lowScore.breakdown.recommendedEscalationLevel).toBe("Documentation interne prioritaire");
    expect(mediumScore.breakdown.recommendedEscalationLevel).toBe("Inspection du travail / accompagnement juridique recommande");
    expect(highScore.breakdown.recommendedEscalationLevel).toBe("Inspection du travail / accompagnement juridique recommande");
  });

  it("calculates employer liability risk correctly", () => {
    const supervisorNotified = simulateHarassmentScenario({
      calculationDate: "2026-02-12",
      incidentsCount: 5,
      witnessesCount: 0,
      hasWrittenProof: false,
      hasMedicalProof: false,
      harassmentType: "moral",
      perpetratorRelationship: "supervisor",
      hrNotified: true,
      companySize: "large",
    });

    const supervisorNotNotified = simulateHarassmentScenario({
      calculationDate: "2026-02-12",
      incidentsCount: 5,
      witnessesCount: 0,
      hasWrittenProof: false,
      hasMedicalProof: false,
      harassmentType: "moral",
      perpetratorRelationship: "supervisor",
      hrNotified: false,
      companySize: "large",
    });

    const colleagueNotified = simulateHarassmentScenario({
      calculationDate: "2026-02-12",
      incidentsCount: 5,
      witnessesCount: 0,
      hasWrittenProof: false,
      hasMedicalProof: false,
      harassmentType: "moral",
      perpetratorRelationship: "colleague",
      hrNotified: true,
      companySize: "large",
    });

    const clientLarge = simulateHarassmentScenario({
      calculationDate: "2026-02-12",
      incidentsCount: 5,
      witnessesCount: 0,
      hasWrittenProof: false,
      hasMedicalProof: false,
      harassmentType: "moral",
      perpetratorRelationship: "client",
      hrNotified: false,
      companySize: "large",
    });

    const clientSmall = simulateHarassmentScenario({
      calculationDate: "2026-02-12",
      incidentsCount: 5,
      witnessesCount: 0,
      hasWrittenProof: false,
      hasMedicalProof: false,
      harassmentType: "moral",
      perpetratorRelationship: "client",
      hrNotified: false,
      companySize: "small",
    });

    expect(supervisorNotified.breakdown.employerLiabilityRisk).toContain("Responsabilite directe de l'employeur engagée");
    expect(supervisorNotNotified.breakdown.employerLiabilityRisk).toContain("lors du signalement formel");
    expect(colleagueNotified.breakdown.employerLiabilityRisk).toContain("Obligation de resultat activee");
    expect(clientLarge.breakdown.employerLiabilityRisk).toContain("Obligation de protection du salarie applicable");
    expect(clientSmall.breakdown.employerLiabilityRisk).toContain("Protection plus limitee pour petite entreprise");
  });

  it("includes comprehensive explanation", () => {
    const result = simulateHarassmentScenario({
      calculationDate: "2026-02-12",
      incidentsCount: 5,
      witnessesCount: 2,
      hasWrittenProof: true,
      hasMedicalProof: false,
      harassmentType: "moral",
      perpetratorRelationship: "supervisor",
      hrNotified: false,
      companySize: "large",
    });

    expect(result.explanation.summary).toContain("Score dossier");
    expect(result.explanation.assumptions).toHaveLength(4);
    expect(result.explanation.formulas).toHaveLength(2);
    expect(result.explanation.warnings.length).toBeGreaterThan(0);
    expect(result.explanation.nextSteps.length).toBeGreaterThan(0);
  });

  it("handles edge case with no priority actions", () => {
    const result = simulateHarassmentScenario({
      calculationDate: "2026-02-12",
      incidentsCount: 50,
      witnessesCount: 10,
      hasWrittenProof: true,
      hasMedicalProof: true,
      harassmentType: "moral",
      perpetratorRelationship: "supervisor",
      hrNotified: true,
      companySize: "large",
    });

    expect(result.explanation.nextSteps).toContain("Dossier bien constitue — preparer le signalement inspection du travail.");
  });
});
