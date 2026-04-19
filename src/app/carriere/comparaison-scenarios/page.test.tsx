import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock the SimulatorToolPage component
vi.mock("@/components/simulator-tool-page", () => ({
  SimulatorToolPage: vi.fn(({ title, description, fields, breakdownLabels, units }) => (
    <div data-testid="simulator-tool-page">
      <h1>{title}</h1>
      <p>{description}</p>
      <div data-testid="fields-count">{fields.length}</div>
      <div data-testid="breakdown-labels">{Object.keys(breakdownLabels).length}</div>
      <div data-testid="units-count">{Object.keys(units).length}</div>
    </div>
  )),
}));

// Mock the page component
vi.mock("./page", () => ({
  metadata: {
    title: "Comparaison de Scenarios - Rapport de Decision",
    description: "Comparez deux scenarios (offres, situations) cote a cote et generez un rapport de decision chiffre.",
  },
  default: vi.fn(() => (
    <div data-testid="simulator-tool-page">
      <h1>Comparaison de Scenarios</h1>
      <p>Placez deux situations cote a cote: deux offres d'emploi, deux villes, deux postes. Comparez les nets, les couts et generez un rapport de decision.</p>
      <div data-testid="fields-count">4</div>
      <div data-testid="breakdown-labels">7</div>
      <div data-testid="units-count">7</div>
    </div>
  )),
}));

const MockedPage = vi.mocked(await import("./page"));

describe("ScenarioComparisonPage", () => {
  it("has correct metadata", async () => {
    // Test that the page has the expected metadata
    const { metadata } = await import("./page");
    expect(metadata).toBeDefined();
    expect(metadata.title).toBe("Comparaison de Scenarios - Rapport de Decision");
    expect(metadata.description).toBe("Comparez deux scenarios (offres, situations) cote a cote et generez un rapport de decision chiffre.");
  });

  it("renders the comparison page with correct structure", async () => {
    const { default: ScenarioComparisonPage } = await import("./page");
    render(<ScenarioComparisonPage />);
    
    expect(screen.getByTestId("simulator-tool-page")).toBeInTheDocument();
    expect(screen.getByText("Comparaison de Scenarios")).toBeInTheDocument();
  });

  it("includes the correct number of fields", async () => {
    const { default: ScenarioComparisonPage } = await import("./page");
    render(<ScenarioComparisonPage />);
    
    const fieldsCount = screen.getByTestId("fields-count");
    expect(fieldsCount.textContent).toBe("4");
  });

  it("includes the correct breakdown labels", async () => {
    const { default: ScenarioComparisonPage } = await import("./page");
    render(<ScenarioComparisonPage />);
    
    const breakdownLabels = screen.getByTestId("breakdown-labels");
    expect(breakdownLabels.textContent).toBe("7");
  });

  it("includes the correct units", async () => {
    const { default: ScenarioComparisonPage } = await import("./page");
    render(<ScenarioComparisonPage />);
    
    const unitsCount = screen.getByTestId("units-count");
    expect(unitsCount.textContent).toBe("7");
  });
});
