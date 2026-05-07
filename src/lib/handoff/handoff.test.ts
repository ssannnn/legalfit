import { describe, expect, it } from "vitest";

import { createHandoffPlan } from "./handoff";
import type { ReadinessInput } from "../routing/readiness";

const confirmedProfile: ReadinessInput = {
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
  declaredDocumentation: {
    exportInvoices: "declared_available",
    revenueSummary: "declared_available",
    contracts: "declared_available"
  },
  consents: {
    processing: true,
    handoff: true,
    contact: true
  },
  riskSignals: [],
  inconsistencies: []
};

describe("createHandoffPlan", () => {
  it("turns a confirmed actionable profile into a ready_for_anden handoff", () => {
    const plan = createHandoffPlan({
      leadCaseId: "lead-1",
      profile: confirmedProfile,
      siteUrl: "https://legalfit.example",
      generatedAt: "2026-05-07T20:00:00Z"
    });

    expect(plan.status).toBe("ready_for_anden");
    expect(plan.leadCasePatch).toEqual(
      expect.objectContaining({
        lifecycleState: "ready_for_anden",
        commercialState: "new",
        nextAction: "schedule_discovery",
        overallFit: "medium",
        exporterClassification: "current_exporter",
        exportType: "services_software"
      })
    );
    expect(plan.dossier?.record.generatedAt).toBe("2026-05-07T20:00:00Z");
    expect(plan.notification?.leadInboxUrl).toBe(
      "https://legalfit.example/lead-inbox/lead-1"
    );
  });

  it("does not create an actionable handoff for missing-info or out-of-scope cases", () => {
    const missingInfo = createHandoffPlan({
      leadCaseId: "lead-1",
      profile: {
        ...confirmedProfile,
        contactEmail: null
      },
      siteUrl: "https://legalfit.example"
    });
    const outOfScope = createHandoffPlan({
      leadCaseId: "lead-2",
      profile: {
        ...confirmedProfile,
        activityType: "goods",
        exportType: "goods"
      },
      siteUrl: "https://legalfit.example"
    });

    expect(missingInfo.status).toBe("not_actionable");
    expect(missingInfo.leadCasePatch.nextAction).toBe("request_missing_info");
    expect(missingInfo.dossier).toBe(null);
    expect(outOfScope.status).toBe("not_actionable");
    expect(outOfScope.leadCasePatch.nextAction).toBe("out_of_scope");
    expect(outOfScope.dossier).toBe(null);
  });
});
