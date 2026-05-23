import { describe, expect, it } from "vitest";
import {
  canShowEmployerResultCta,
  resolveAudienceMode,
  withAudienceQuery,
} from "@/lib/audience/audience-mode";

describe("audience mode", () => {
  it("forces employer mode inside the employer workspace", () => {
    expect(resolveAudienceMode({ pathname: "/employer/payroll", storedMode: "employee" })).toBe("employer");
  });

  it("uses explicit audience context outside the employer workspace", () => {
    expect(resolveAudienceMode({ pathname: "/planifier/bulletin-paie", queryMode: "employer" })).toBe("employer");
    expect(resolveAudienceMode({ pathname: "/simulateurs/licenciement", storedMode: "employee" })).toBe("employee");
  });

  it("keeps employer actions out of employee-sensitive calculators", () => {
    expect(
      canShowEmployerResultCta({
        audienceMode: "employer",
        calculatorType: "licenciement",
        pathname: "/simulateurs/licenciement/result",
      }),
    ).toBe(false);
  });

  it("allows employer actions for employer-origin payroll tools", () => {
    expect(
      canShowEmployerResultCta({
        audienceMode: "employer",
        calculatorType: "payslip",
        pathname: "/planifier/bulletin-paie/result",
      }),
    ).toBe(true);
  });

  it("adds audience context without overwriting existing params", () => {
    expect(withAudienceQuery("/planifier/bulletin-paie?grossSalary=9000", "employer")).toBe(
      "/planifier/bulletin-paie?grossSalary=9000&audience=employer",
    );
  });
});
