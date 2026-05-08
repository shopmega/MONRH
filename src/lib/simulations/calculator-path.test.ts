import { describe, expect, it } from "vitest";
import {
  calculatorTypeToPath,
  pathToCalculatorType,
  resultRouteToExpectedPath,
  savedSimulationPathMatches,
} from "@/lib/simulations/calculator-path";

describe("calculator path matching", () => {
  it("matches canonical, internal, and category aliases", () => {
    expect(calculatorTypeToPath("net_gross")).toBe("/simulateurs/brut-net");
    expect(pathToCalculatorType("/simulateurs/brut-net")).toBe("net_gross");
    expect(pathToCalculatorType("/simulate/net-gross")).toBe("net_gross");
    expect(pathToCalculatorType("/salaire/brut-net")).toBe("net_gross");
  });

  it("accepts anonymous snapshots from internal simulate routes on result pages", () => {
    expect(savedSimulationPathMatches("/simulate/net-gross", "net_gross", "/simulateurs/brut-net")).toBe(true);
    expect(savedSimulationPathMatches("/salaire/brut-net", "net_gross", "/simulateurs/brut-net")).toBe(true);
    expect(savedSimulationPathMatches("/simulate/annual-income-tax", "net_gross", "/simulateurs/brut-net")).toBe(false);
  });

  it("keeps rewritten French simulator result routes matched to their canonical simulator paths", () => {
    const expectedPath = resultRouteToExpectedPath("simulate", "brut-net");

    expect(expectedPath).toBe("/simulateurs/brut-net");
    expect(pathToCalculatorType(expectedPath)).toBe("net_gross");
    expect(savedSimulationPathMatches(expectedPath, "net_gross", "/simulateurs/brut-net")).toBe(true);
  });
});
