import { describe, expect, it } from "vitest";

import {
  applyRulebook,
  type RulebookProfile,
  zfServicesArV010Rulebook
} from "./rulebook";

const baseProfile: RulebookProfile = {
  activityType: "services_software",
  exportType: "services_software",
  exportsToday: true,
  exportRevenueRange: "usd_250k_1m",
  urgency: true,
  countries: ["United States", "Chile"],
  billing: "factura_e_exportacion",
  collection: "cuenta_banco_exterior",
  recurringRevenue: true,
  declaredDocumentation: {
    exportInvoices: "declared_available",
    revenueSummary: "declared_available",
    contracts: "declared_available"
  },
  riskSignals: [],
  inconsistencies: []
};

describe("zfServicesArV010Rulebook", () => {
  it("exposes versioned source pack metadata pending Anden legal/ops validation", () => {
    expect(zfServicesArV010Rulebook.version).toBe("zf_services_ar_v0.1.0");
    expect(zfServicesArV010Rulebook.validation.owner).toBe("Anden legal/ops");
    expect(zfServicesArV010Rulebook.validation.status).toBe("pending_final_copy_review");
    expect(zfServicesArV010Rulebook.sourcePack.sources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Ley 24.331 de Zonas Francas"
        }),
        expect.objectContaining({
          label: "Codigo Aduanero Ley 22.415"
        }),
        expect.objectContaining({
          label: "ARCA exportacion de servicios"
        })
      ])
    );
  });

  it("keeps rule definitions in code/config with the required review fields", () => {
    for (const rule of zfServicesArV010Rulebook.rules) {
      expect(rule).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          version: zfServicesArV010Rulebook.version,
          module: "zonas_francas_services_ar",
          effect: expect.any(Object),
          severity: expect.any(String),
          sourceUrl: expect.any(String),
          sourceLabel: expect.any(String),
          internalExplanation: expect.any(String),
          userSafeCopy: expect.any(String),
          requiresSpecialistReview: expect.any(Boolean)
        })
      );
    }
  });
});

describe("applyRulebook", () => {
  it("returns matched rule results with safe user copy and Anden source references", () => {
    const results = applyRulebook(zfServicesArV010Rulebook, baseProfile);

    expect(results).toContainEqual(
      expect.objectContaining({
        ruleId: "zf-services-current-exporter",
        result: "matched",
        rulebookVersion: "zf_services_ar_v0.1.0",
        sourceLabel: "Ley 24.331 de Zonas Francas",
        sourceUrl: expect.stringContaining("argentina.gob.ar"),
        userSafeCopy: expect.not.stringContaining("aplica")
      })
    );
  });

  it("marks high volume urgent exporters as a commercial priority signal", () => {
    const results = applyRulebook(zfServicesArV010Rulebook, baseProfile);

    expect(results).toContainEqual(
      expect.objectContaining({
        ruleId: "zf-services-high-priority-threshold",
        result: "matched",
        effect: expect.objectContaining({
          nextActionSignal: "high_priority_case"
        }),
        evidenceSnapshot: expect.objectContaining({
          exportRevenueRange: "usd_250k_1m",
          urgency: true
        })
      })
    );
  });

  it("routes sensitive complexity signals toward specialist review", () => {
    const results = applyRulebook(zfServicesArV010Rulebook, {
      ...baseProfile,
      riskSignals: ["multiple_jurisdictions"],
      inconsistencies: ["billing_collection_mismatch"]
    });

    expect(results).toContainEqual(
      expect.objectContaining({
        ruleId: "zf-services-specialist-review-signals",
        result: "matched",
        requiresSpecialistReview: true,
        effect: expect.objectContaining({
          nextActionSignal: "specialist_review"
        }),
        evidenceSnapshot: expect.objectContaining({
          riskSignals: ["multiple_jurisdictions"],
          inconsistencies: ["billing_collection_mismatch"]
        })
      })
    );
  });

  it("records unknown when a rule cannot evaluate because evidence is missing", () => {
    const results = applyRulebook(zfServicesArV010Rulebook, {
      ...baseProfile,
      billing: null
    });

    expect(results).toContainEqual(
      expect.objectContaining({
        ruleId: "zf-services-export-billing-signal",
        result: "unknown",
        missingData: ["billing"]
      })
    );
  });
});
