import { describe, expect, it, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";

// Mock the tool access enforcement
vi.mock("@/lib/server/tool-access-enforcement", () => ({
  requireToolAccessOrResponse: vi.fn(() => null),
}));

// Mock the calculator
vi.mock("@/lib/calculators/salary-increase", () => ({
  salaryIncreaseInputSchema: {
    parse: vi.fn((data) => {
      if (!data.newGross || data.newGross <= 0 || data.currentGross <= 0) {
        throw new Error("Validation failed");
      }
      return data;
    }),
  },
  simulateSalaryIncrease: vi.fn((input) => ({
    calculationDate: input.calculationDate,
    currentGross: input.currentGross,
    newGross: input.newGross,
    rawIncreasePercent: 20,
    current: {
      net: 8500,
      cnssEmployee: 229.5,
      amoEmployee: 42.5,
      cimrEmployee: 0,
      incomeTax: 1228,
      employerTotalCost: 11272,
    },
    proposed: {
      net: 10200,
      cnssEmployee: 275.4,
      amoEmployee: 51,
      cimrEmployee: 0,
      incomeTax: 1473.6,
      employerTotalCost: 13526.4,
    },
    netGain: {
      monthly: 1700,
      annual: 20400,
      realIncreasePercent: 20,
      employerCostDelta: 2254.4,
    },
    explanation: {
      summary: "Une augmentation brute de 20% se traduit par un gain net reel de 20% (1700 MAD/mois).",
      warnings: ["L'IR etant progressif, l'augmentation brute produit toujours un gain net inferieur au gain brut.", "Verifiez si l'augmentation modifie votre tranche marginale d'IR.", "Le gain net est proportionnel a l'augmentation brute."],
      nextSteps: ["Utilisez ce rapport pour etayer votre demande d'augmentation.", "L'employeur supportera 2254.4 MAD/mois de cout additionnel.", "Comparez ce gain avec vos objectifs de vie (credit, epargne)."],
    },
  })),
}));

describe("POST /api/simulate/salary-increase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns successful simulation result", async () => {
    const request = new NextRequest("http://localhost:3000/api/simulate/salary-increase", {
      method: "POST",
      body: JSON.stringify({
        currentGross: 10000,
        newGross: 12000,
        calculationDate: "2026-01-01",
        includeCimr: false,
        cimrRate: 0.06,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.calculatorType).toBe("salary_increase");
    expect(data.result).toBeDefined();
    expect(data.result.currentGross).toBe(10000);
    expect(data.result.newGross).toBe(12000);
    expect(data.result.netGain.monthly).toBe(1700);
  });

  it("handles missing required fields", async () => {
    const request = new NextRequest("http://localhost:3000/api/simulate/salary-increase", {
      method: "POST",
      body: JSON.stringify({
        currentGross: 10000,
        // missing newGross
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.ok).toBe(false);
    expect(data.message).toBe("Invalid simulation payload.");
  });

  it("handles invalid JSON", async () => {
    const request = new NextRequest("http://localhost:3000/api/simulate/salary-increase", {
      method: "POST",
      body: "invalid json",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.ok).toBe(false);
    expect(data.message).toBe("Invalid simulation payload.");
  });

  it("handles negative salary values", async () => {
    const request = new NextRequest("http://localhost:3000/api/simulate/salary-increase", {
      method: "POST",
      body: JSON.stringify({
        currentGross: -1000,
        newGross: 12000,
        calculationDate: "2026-01-01",
        includeCimr: false,
        cimrRate: 0.06,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.ok).toBe(false);
    expect(data.message).toBe("Invalid simulation payload.");
  });

  it("handles CIMR inclusion", async () => {
    const request = new NextRequest("http://localhost:3000/api/simulate/salary-increase", {
      method: "POST",
      body: JSON.stringify({
        currentGross: 10000,
        newGross: 12000,
        calculationDate: "2026-01-01",
        includeCimr: true,
        cimrRate: 0.06,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.result).toBeDefined();
  });

  it("handles default values", async () => {
    const request = new NextRequest("http://localhost:3000/api/simulate/salary-increase", {
      method: "POST",
      body: JSON.stringify({
        currentGross: 10000,
        newGross: 12000,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.result).toBeDefined();
  });

  it("validates response structure", async () => {
    const request = new NextRequest("http://localhost:3000/api/simulate/salary-increase", {
      method: "POST",
      body: JSON.stringify({
        currentGross: 10000,
        newGross: 12000,
        calculationDate: "2026-01-01",
        includeCimr: false,
        cimrRate: 0.06,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("ok");
    expect(data).toHaveProperty("calculatorType");
    expect(data).toHaveProperty("result");
    
    // Validate result structure
    const result = data.result;
    expect(result).toHaveProperty("calculationDate");
    expect(result).toHaveProperty("currentGross");
    expect(result).toHaveProperty("newGross");
    expect(result).toHaveProperty("rawIncreasePercent");
    expect(result).toHaveProperty("current");
    expect(result).toHaveProperty("proposed");
    expect(result).toHaveProperty("netGain");
    expect(result).toHaveProperty("explanation");
    
    // Validate nested structures
    expect(result.current).toHaveProperty("net");
    expect(result.current).toHaveProperty("cnssEmployee");
    expect(result.current).toHaveProperty("amoEmployee");
    expect(result.current).toHaveProperty("cimrEmployee");
    expect(result.current).toHaveProperty("incomeTax");
    expect(result.current).toHaveProperty("employerTotalCost");
    
    expect(result.netGain).toHaveProperty("monthly");
    expect(result.netGain).toHaveProperty("annual");
    expect(result.netGain).toHaveProperty("realIncreasePercent");
    expect(result.netGain).toHaveProperty("employerCostDelta");
    
    expect(result.explanation).toHaveProperty("summary");
    expect(result.explanation).toHaveProperty("warnings");
    expect(result.explanation).toHaveProperty("nextSteps");
  });
});
