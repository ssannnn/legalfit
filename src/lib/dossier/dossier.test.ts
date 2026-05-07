import { describe, expect, it } from "vitest";

import { buildDossier } from "./dossier";
import type { ReadinessInput } from "../routing/readiness";

const confirmedProfile: ReadinessInput = {
  companyName: "Demo SaaS Exportadora",
  contactName: "Lucia Demo",
  contactRole: "Founder",
  contactEmail: "lucia@example.com",
  activityType: "services_software",
  exportType: "services_software",
  exportsToday: true,
  exportRevenueRange: "usd_250k_1m",
  countries: ["United States", "Chile"],
  billing: "factura_e_exportacion",
  collection: "cuenta_banco_exterior",
  recurringRevenue: true,
  teamSize: "12",
  consultationMotive: "Evaluar zona franca",
  urgency: true,
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

describe("buildDossier", () => {
  it("creates a user-safe summary without internal routing fields", () => {
    const dossier = buildDossier(confirmedProfile);

    expect(dossier.userSummary).toEqual(
      expect.objectContaining({
        companyName: "Demo SaaS Exportadora",
        contactEmail: "lucia@example.com",
        checklist: expect.arrayContaining([
          "Facturas o invoices de exportacion",
          "Resumen de cobros por pais/canal"
        ])
      })
    );

    expect(JSON.stringify(dossier.userSummary)).not.toContain("nextAction");
    expect(JSON.stringify(dossier.userSummary)).not.toContain("overallFit");
    expect(JSON.stringify(dossier.userSummary)).not.toContain("fitDimensions");
  });

  it("creates an Anden dossier with routing, fit, evidence and source references", () => {
    const dossier = buildDossier(confirmedProfile);

    expect(dossier.andenDossier).toEqual(
      expect.objectContaining({
        nextAction: "high_priority_case",
        overallFit: "high",
        fitDimensions: expect.objectContaining({
          operationalFit: expect.any(Object),
          commercialFit: expect.any(Object),
          documentationReadiness: expect.any(Object),
          riskReviewNeeded: expect.any(Object)
        }),
        ruleResults: expect.arrayContaining([
          expect.objectContaining({
            ruleId: "zf-services-high-priority-threshold",
            result: "matched",
            sourceUrl: expect.stringContaining("argentina.gob.ar")
          })
        ])
      })
    );
  });

  it("records snapshot metadata needed for immutable persistence", () => {
    const dossier = buildDossier(confirmedProfile);

    expect(dossier.record).toEqual(
      expect.objectContaining({
        rulebookVersion: "zf_services_ar_v0.1.0",
        generatedAt: expect.any(String),
        userSummary: dossier.userSummary,
        andenDossier: dossier.andenDossier
      })
    );
  });
});
