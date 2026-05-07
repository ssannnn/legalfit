import { describe, expect, it } from "vitest";

import {
  classifyExporter,
  classifyReadiness,
  validateCriticalData,
  type FitLevel,
  type NextAction,
  type ReadinessInput
} from "./readiness";

const completeCurrentExporter: ReadinessInput = {
  companyName: "Demo SaaS Exportadora",
  contactName: "Lucia Demo",
  contactRole: "Founder",
  contactEmail: "lucia@example.com",
  activityType: "services_software",
  exportType: "services_software",
  exportsToday: true,
  exportRevenueRange: "usd_50k_250k",
  countries: ["United States", "Chile"],
  billing: "factura_e_exportacion",
  collection: "banco_argentina",
  recurringRevenue: true,
  teamSize: "12",
  consultationMotive: "Evaluar zona franca",
  urgency: false,
  declaredDocumentation: {
    exportInvoices: "declared_available",
    revenueSummary: "declared_available",
    contracts: "declared_unknown"
  },
  consents: {
    processing: true,
    handoff: true,
    contact: true
  },
  riskSignals: [],
  inconsistencies: []
};

describe("validateCriticalData", () => {
  it("identifies routing blockers separately from non-blocking unknowns", () => {
    const result = validateCriticalData({
      ...completeCurrentExporter,
      companyName: "",
      contactEmail: "",
      exportRevenueRange: "prefer_not_to_answer",
      declaredDocumentation: {
        exportInvoices: "declared_unknown"
      }
    });

    expect(result.missingCriticalFields).toEqual([
      "companyName",
      "contactEmail"
    ]);
    expect(result.nonBlockingUnknownFields).toEqual([
      "exportRevenueRange",
      "declaredDocumentation.exportInvoices"
    ]);
    expect(result.canRoute).toBe(false);
  });
});

describe("classifyExporter", () => {
  it("distinguishes current, future and exploratory exporters", () => {
    expect(classifyExporter(completeCurrentExporter).classification).toBe(
      "current_exporter"
    );

    expect(
      classifyExporter({
        ...completeCurrentExporter,
        exportsToday: false,
        exportRevenueRange: "no_exports",
        countries: [],
        billing: null,
        collection: null,
        recurringRevenue: null,
        futureExportSignals: ["active_international_pipeline"]
      }).classification
    ).toBe("future_exporter");

    expect(
      classifyExporter({
        ...completeCurrentExporter,
        exportsToday: false,
        exportRevenueRange: "no_exports",
        countries: [],
        billing: null,
        collection: null,
        recurringRevenue: null,
        futureExportSignals: []
      }).classification
    ).toBe("exploratory");
  });

  it("marks goods-only cases as outside MVP readiness scope", () => {
    expect(
      classifyExporter({
        ...completeCurrentExporter,
        activityType: "goods",
        exportType: "goods"
      })
    ).toEqual({
      classification: "exploratory",
      outOfScopeReason: "goods_only"
    });
  });
});

describe("classifyReadiness", () => {
  const routingCases: Array<{
    name: string;
    input: ReadinessInput;
    nextAction: NextAction;
    overallFit: FitLevel;
  }> = [
    {
      name: "request missing info",
      input: {
        ...completeCurrentExporter,
        contactEmail: ""
      },
      nextAction: "request_missing_info",
      overallFit: "unknown"
    },
    {
      name: "out of scope",
      input: {
        ...completeCurrentExporter,
        activityType: "goods",
        exportType: "goods"
      },
      nextAction: "out_of_scope",
      overallFit: "low"
    },
    {
      name: "specialist review",
      input: {
        ...completeCurrentExporter,
        riskSignals: ["multiple_jurisdictions"]
      },
      nextAction: "specialist_review",
      overallFit: "medium"
    },
    {
      name: "high priority case",
      input: {
        ...completeCurrentExporter,
        exportRevenueRange: "usd_250k_1m",
        urgency: true,
        declaredDocumentation: {
          exportInvoices: "declared_available",
          revenueSummary: "declared_available",
          contracts: "declared_available"
        }
      },
      nextAction: "high_priority_case",
      overallFit: "high"
    },
    {
      name: "schedule discovery",
      input: completeCurrentExporter,
      nextAction: "schedule_discovery",
      overallFit: "medium"
    },
    {
      name: "not now",
      input: {
        ...completeCurrentExporter,
        exportsToday: false,
        exportRevenueRange: "no_exports",
        countries: [],
        billing: null,
        collection: null,
        recurringRevenue: null,
        futureExportSignals: []
      },
      nextAction: "not_now",
      overallFit: "low"
    }
  ];

  it.each(routingCases)(
    "routes a complete case to $name",
    ({ input, nextAction, overallFit }) => {
      const result = classifyReadiness(input);

      expect(result.nextAction).toBe(nextAction);
      expect(result.overallFit).toBe(overallFit);
      expect(result.fitDimensions.operationalFit.reason).not.toHaveLength(0);
      expect(result.fitDimensions.commercialFit.evidenceUsed.length).toBeGreaterThan(
        0
      );
    }
  );
});
